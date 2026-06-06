# Modular app — design docs

The refactor from fixed per-page tables (Pain, Diary, CBT, DBT) to a
modular model where the user builds their own pages from reusable
modules. Tracked by milestone "Modular app" and issue #128.

## Contents

| File | Purpose |
|------|---------|
| [`01-architecture.md`](./01-architecture.md) | The architecture decision: EAV data model, page builder, editing surfaces, retroactivity rules, migration |

## TL;DR

- Three concepts: **metric type** (what you track) → **page** (which
  modules, in what order) → **entry** (a recorded submission). Stored
  EAV-style.
- Module kinds: `scale`, `counter`, `tags`, `text`, `measure` (number +
  unit, for tests/measurements).
- Pages come in two preset categories: **customizable templates** (Pain,
  Diary) and **locked therapies** (CBT, DBT).
- Two ways to edit: a **builder page** and an **inline pencil** on custom
  pages. Both edit the same metric type.
- Rename = global + retroactive (one row). Range changes never destroy
  old values; each value snapshots its scale so history stays faithful.
- Existing data is migrated; the app stays functional throughout
  (strangler-fig), legacy tables dropped last.

Read [`01-architecture.md`](./01-architecture.md) for the full decision.
