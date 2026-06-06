# Modular app — architecture decision

Status: **accepted** (epic #128, milestone "Modular app"; ADR merged in #152).
Supersedes the fixed per-page model for Pain, Diary, CBT, DBT.

## Context

Today every page is a hard-coded table with fixed columns:
`diary_entries`, `pain_entries`, `cbt_entries`, `dbt_entries`, plus
per-field option tables (`pain_options`, `mood_options`). Adding a new
thing to track means a migration, a route, a hook, and a UI section.
The options are "there whether you want them or not".

Goal: the user builds their own pages by choosing which values to track
from a set, and can create new value types. Existing pages survive as
presets. No data loss.

## Decision

Decouple three concepts that are fused today:

1. **Metric type** — *what* can be tracked (mood, pain, coffee, a custom
   "hours slept"). Has a `kind`.
2. **Page** — an ordered collection of metric types, with a name/icon
   and a category.
3. **Entry** — a recorded submission on a page at a date/time, holding
   the values (EAV: entity–attribute–value).

### Metric `kind` set

| kind | widget (reused) | stored in |
|------|-----------------|-----------|
| `scale` | `BarMetric` (1..N) | `value_num` + scale snapshot |
| `counter` | `CoffeeStepper` | `value_num` |
| `tags` | `MultiSelectField` + options | `value_tags` (CSV) |
| `text` | `<textarea>` | `value_text` |
| `measure` | number + unit (new) | `value_num` + `unit` |

`measure` is new: a number with a unit (e.g. weight 72.5 kg, a lab
result). This is the "test input" value the user asked for; `text` is
the free-text "text input".

### Metric types are seeded per user, and editable

We follow the **existing precedent**: `mood_options`/`pain_options` are
already seeded per user (`INSERT … SELECT u.id … FROM users u`). So
`metric_types` are seeded per user too and **fully owned and editable**
by that user. There is no global, immutable "built-in" type — there are
seeded defaults the user can rename, re-range, archive, or extend.

### Page categories

- `custom` — user adds/removes/reorders fields and edits each module.
  Pain and Diary start here as customizable templates.
- `therapy` — locked preset; fields fixed and in a fixed order. CBT and
  DBT. The user can add or hide a therapy but not edit its fields
  (preserves the clinical structure). No inline editor.

Editability derives from `category` (`custom` → editable, `therapy` →
locked); it is not stored as an independent flag, so the two cannot
disagree.

Same EAV engine backs both categories, so charts, search, and the MCP
tools work uniformly — only the `category` differs.

### Two editing surfaces

1. **Builder page** — manage pages: add a page (blank or from a preset
   in the gallery: templates vs therapies), add/remove/reorder modules,
   create a new metric type.
2. **Inline editor** — a pencil next to a module's title on a *custom*
   page, to edit that module's config (title, scale range, unit, …) in
   place. Disabled on `therapy` pages.

Both surfaces edit the **same** `metric_types` row through the same API.

### Retroactivity rules (the subtle part)

- **Title/label → global and retroactive.** The label lives once on
  `metric_types`. History (`entry_values`) references the metric by id
  and never copies the label, so a rename is a single-row update that
  shows everywhere, past included. A module is one definition: renaming
  it on one page renames it on every page that uses it (decided #128).
- **Numeric range (min/max/step) → editable but never destructive.**
  Changing a scale from 1–9 to 1–5 must not clamp old 7/8/9 values.
  `entry_values` rows are **immutable** once written; we never rewrite
  them on a config change.
- **Faithful history via snapshot.** Each `entry_value` snapshots the
  scale it was entered with (`scale_min`, `scale_max`) and the `unit`
  at write time. An old value renders as "7/9" while new ones render
  "x/5"; charts stay correct (decided #128).
- **`kind` is immutable once entries exist.** Changing
  scale → counter → text would garble stored values. To change kind,
  create a new metric type. Validated at the API boundary.
- **Removing a tag option is non-destructive.** Past `value_tags` keep
  removed tags; the option just stops being offered (today's
  remove/restore behaviour, generalized).

### Naming

`entries` + `entry_values`. The legacy `*_entries` tables keep their
prefixes and are dropped only in Phase 4, so there is no collision
during the transition.

### Validation

zod at the HTTP boundary (AGENTS.md §5). New values are validated
against the metric's `kind` and current range. Historical out-of-range
values are accepted on read (they were valid under their snapshot) —
validation constrains *new* input only.

### Full-text search

Replace the four per-table FTS5 tables with a single FTS over
`entry_values.value_text` (text-kind values), with triggers mirroring
today's pattern. Can land within Phase 2/3 rather than blocking.

## Schema

SQL style mirrors `backend/src/schema.ts` (idempotent
`CREATE TABLE IF NOT EXISTS`, `INTEGER`/`TEXT`, `user_id` FK CASCADE).

```sql
metric_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  key TEXT NOT NULL,                 -- stable slug, e.g. 'mood'
  label TEXT NOT NULL,               -- display name (renameable)
  kind TEXT NOT NULL,                -- scale|counter|tags|text|measure
  unit TEXT,                         -- measure/counter
  min_value REAL, max_value REAL, step REAL,  -- scale/counter/measure
  config_json TEXT NOT NULL DEFAULT '{}',
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)

metric_options (                     -- replaces pain_options + mood_options
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  metric_type_id INTEGER NOT NULL,
  value TEXT NOT NULL,
  preselected INTEGER NOT NULL DEFAULT 1,
  archived_at TEXT,
  UNIQUE(user_id, metric_type_id, value),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (metric_type_id) REFERENCES metric_types(id) ON DELETE CASCADE
)

pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'custom'     -- custom|therapy
    CHECK (category IN ('custom','therapy')),
  -- editability derives from category (single source of truth, so the
  -- two can never disagree): custom = editable, therapy = locked.
  editable INTEGER GENERATED ALWAYS AS (category = 'custom') VIRTUAL,
  source_template TEXT,                       -- e.g. 'diary','cbt'
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)

page_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER NOT NULL,
  metric_type_id INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  config_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(page_id, metric_type_id),
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (metric_type_id) REFERENCES metric_types(id) ON DELETE CASCADE
)

entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  page_id INTEGER,
  entry_date TEXT NOT NULL,
  entry_time TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE SET NULL
)

entry_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  metric_type_id INTEGER NOT NULL,
  value_num REAL,                    -- scale|counter|measure
  value_text TEXT,                   -- text
  value_tags TEXT,                   -- tags (CSV)
  unit TEXT,                         -- snapshot at write time
  scale_min REAL, scale_max REAL,    -- snapshot at write time
  FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
  -- RESTRICT, not CASCADE: a metric type that has history cannot be
  -- hard-deleted, so logged values are never cascaded away. Metric
  -- types are archived (archived_at), never hard-deleted. (User
  -- deletion still works: entry_values clear via the entries->users
  -- cascade before the metric_types path is reached.)
  FOREIGN KEY (metric_type_id) REFERENCES metric_types(id) ON DELETE RESTRICT
)
```

Indexes: `entries(user_id, entry_date DESC, entry_time DESC)`,
`entry_values(entry_id)`, `entry_values(metric_type_id)`.

## Migration (legacy → modular)

Highest-risk step — real health data. Per user:

1. **Back up** the SQLite file first.
2. Seed `metric_types` from existing fields:
   - scale: mood, depression, anxiety (from `diary_entries`); pain,
     fatigue (from `pain_entries`) — all `1..9`.
   - counter: coffee (`pain_entries.coffee_count`).
   - tags: positive/negative/general moods; area, symptoms, activities,
     medicines, habits, other — migrate `mood_options`/`pain_options`
     (incl. `preselected`) into `metric_options`. Removed-state moves
     from row-presence in the separate `*_removed_options` tables to
     `archived_at IS NOT NULL` on `metric_options`.
   - text: diary description, gratitude; pain note; each CBT and DBT
     field.
3. Seed 4 pages per user: Pain, Diary (`custom`); CBT, DBT (`therapy`,
   locked), with `page_fields` in today's order.
4. Backfill: each legacy row → 1 `entries` + N `entry_values`, snapshot
   `scale_min/max = 1/9` for scales, `unit` where known.
5. Keep legacy tables read-only until the frontend switch (Phase 3) is
   verified; drop them in Phase 4.

Reversible (down migration), idempotent (safe to re-run), and tested on
a **copy** of prod before touching the real DB (AGENTS.md §11). The repo
has no down-migration machinery today (migrations are forward-only —
`migrationStatements` + `columnExists` guards in `db.ts`), so the
rollback path must be built as part of #142, not assumed.

## Consequences

- (+) New trackables need no schema change — a row in `metric_types`.
- (+) One engine → charts/search/MCP/export work for every page.
- (+) Rename is trivially retroactive; history is faithful by snapshot.
- (−) EAV loses column-level constraints → must validate in code.
- (−) Charts must generalize from fixed columns to metric types (#149).
- (−) Reads join `entries`+`entry_values` instead of one row; fine at
  personal-app scale, watch the N+1 (AGENTS.md §12) — fetch values per
  page of entries in one query.

## Reversibility

Cheap until the Phase 1 migration runs with real data. Strangler-fig:
the new engine is built beside the old, data migrated, frontend switched,
then legacy dropped (#150). Point of no return = dropping legacy tables.

## Open questions / deferred

- Export/import format (`scripts/`, settings backup) must learn the new
  model — track separately.
- Per-page field config (`page_fields.config_json`) is reserved but
  unused for now (no per-page label override; rename is global).
- FTS cutover timing (Phase 2 vs 3).

## Phase plan

- Phase 0: this ADR (#137).
- Phase 1 — data: #138 metric_types, #139 metric_options, #140 pages +
  page_fields, #141 entries + entry_values, #142 migration.
- Phase 2 — API: #143 metric types CRUD, #144 pages CRUD, #145 entries +
  MCP.
- Phase 3 — frontend: #146 renderer, #147 builder page, #148 render
  templates/therapies, #149 charts, plus the inline editor.
- Phase 4 — cleanup: #150 retire legacy.
