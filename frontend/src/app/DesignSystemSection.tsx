import { useState } from "react";
import { BarMetric, CoffeeStepper } from "./screen-helpers";

const DESIGN_COLOR_TOKENS: { name: string; varName: string; role: string }[] = [
  { name: "Background", varName: "--bg", role: "App canvas" },
  { name: "Card", varName: "--card", role: "Panels, inputs" },
  { name: "Card strong", varName: "--card-strong", role: "Elevated surfaces" },
  { name: "Card soft", varName: "--card-soft", role: "Subtle fills" },
  { name: "Text", varName: "--text", role: "Primary text" },
  { name: "Muted", varName: "--muted", role: "Secondary text" },
  { name: "Muted soft", varName: "--muted-soft", role: "Tertiary text" },
  { name: "Border", varName: "--border", role: "Dividers" },
  { name: "Border soft", varName: "--border-soft", role: "Hairlines" },
  { name: "Accent", varName: "--accent", role: "Primary action" },
  { name: "Accent 2", varName: "--accent-2", role: "Accent hover" },
  { name: "Success", varName: "--success", role: "Positive state" },
  { name: "Warning", varName: "--warning", role: "Mid state" },
  { name: "Danger", varName: "--danger", role: "Negative state" },
];

const DESIGN_SPACING_TOKENS: { varName: string; px: string }[] = [
  { varName: "--layout-tight", px: "4px" },
  { varName: "--layout-inline", px: "8px" },
  { varName: "--layout-stack", px: "12px" },
  { varName: "--layout-block", px: "20px" },
  { varName: "--layout-page", px: "30px" },
  { varName: "--layout-split", px: "48px" },
];

const DS_MEMORABLE_WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const DESIGN_RADIUS_TOKENS: { varName: string; px: string }[] = [
  { varName: "--radius-sm", px: "10px" },
  { varName: "--radius-md", px: "12px" },
  { varName: "--radius-lg", px: "16px" },
];

const DS_SIDEBAR_DEMO_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden width={20} height={20}>
    <circle cx="12" cy="12" r="7" />
  </svg>
);

export function DesignSystemSection() {
  const [moodDemo, setMoodDemo] = useState<number | null>(6);
  const [painDemo, setPainDemo] = useState<number | null>(3);
  const [coffeeDemo, setCoffeeDemo] = useState<number | null>(2);
  const [tabDemo, setTabDemo] = useState<"positive" | "negative" | "general">("positive");

  return (
    <section className="panel">
      <h1 className="panel-title">Design System</h1>
      <p className="hint ds-lede">
        Living reference for tokens, primitives, and patterns used across Diary, Pain, therapy forms, and Memorable days.
        Examples use the same classes as production &mdash; edit <code>styles.css</code> and this page tracks it.
      </p>

      <div className="panel-split panel-split--diary panel-split--after-intro">
        <div className="panel-col ds-col">
          <h2 className="entries-heading">Foundations</h2>

          <section className="ds-section">
            <div className="section-head">
              <span className="section-title">Colors</span>
              <span className="section-aside">CSS custom properties</span>
            </div>
            <ul className="ds-swatches">
              {DESIGN_COLOR_TOKENS.map((t) => (
                <li key={t.varName} className="ds-swatch">
                  <span className="ds-swatch-chip" style={{ background: `var(${t.varName})` }} />
                  <div className="ds-swatch-meta">
                    <span className="ds-swatch-name">{t.name}</span>
                    <code className="ds-swatch-var">{t.varName}</code>
                    <span className="ds-swatch-role">{t.role}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="ds-section">
            <div className="section-head">
              <span className="section-title">Typography</span>
              <span className="section-aside">Manrope</span>
            </div>
            <dl className="ds-type-scale">
              <div className="ds-type-row">
                <dt style={{ font: "700 28px var(--font-body)" }}>Panel title</dt>
                <dd>28 / 700</dd>
              </div>
              <div className="ds-type-row">
                <dt style={{ font: "700 10px var(--font-body)", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)" }}>
                  Entries heading
                </dt>
                <dd>10 / 700 / 0.16em</dd>
              </div>
              <div className="ds-type-row">
                <dt style={{ font: "500 14px var(--font-body)" }}>Body</dt>
                <dd>14 / 500</dd>
              </div>
              <div className="ds-type-row">
                <dt style={{ font: "500 12px var(--font-body)", color: "var(--muted)" }}>Hint</dt>
                <dd>12 / 500 / muted</dd>
              </div>
              <div className="ds-type-row">
                <dt style={{ font: "500 12px var(--font-mono, ui-monospace, Menlo, monospace)", fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>
                  Entry date · Apr 18, 5:03 PM
                </dt>
                <dd>12 / mono / tabular</dd>
              </div>
            </dl>
          </section>

          <section className="ds-section">
            <div className="section-head">
              <span className="section-title">Spacing</span>
              <span className="section-aside">Layout tokens</span>
            </div>
            <p className="hint ds-spacing-lede">
              Use named steps from <code>--layout-tight</code> (4px) through <code>--layout-split</code> — no numbered scale; bar length matches each variable.
            </p>
            <ul className="ds-layout-token-list">
              {DESIGN_SPACING_TOKENS.map((t) => (
                <li key={t.varName} className="ds-layout-token-row">
                  <code>{t.varName}</code>
                  <span className="ds-layout-token-px">{t.px}</span>
                  <span className="ds-layout-token-bar" style={{ width: `var(${t.varName})` }} aria-hidden title={t.varName} />
                </li>
              ))}
            </ul>
            <div className="ds-field-line-spacing-demo">
              <p className="ds-field-line-demo-title">Field-line (label ↔ control)</p>
              <label className="field field-line">
                <span className="field-line-label">Example</span>
                <input type="text" defaultValue="Spacing demo" aria-label="Field-line spacing demo" />
              </label>
              <p className="ds-field-line-spacing-note">
                <code>.field-line</code> uses <strong>gap: var(--layout-inline)</strong>. <code>.field-line-label</code> uses{" "}
                <strong>padding-top: var(--layout-stack)</strong>, <strong>padding-bottom: var(--layout-inline)</strong>; inputs use{" "}
                <strong>padding: var(--layout-inline) var(--layout-stack)</strong> (see <code>styles.css</code>).
              </p>
            </div>
          </section>

          <section className="ds-section">
            <div className="section-head">
              <span className="section-title">Radius</span>
              <span className="section-aside">Rounded corners</span>
            </div>
            <ul className="ds-radius-list">
              {DESIGN_RADIUS_TOKENS.map((t) => (
                <li key={t.varName} className="ds-radius-item">
                  <span className="ds-radius-chip" style={{ borderRadius: `var(${t.varName})` }} />
                  <code>{t.varName}</code>
                  <span className="ds-scale-val">{t.px}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="ds-section">
            <div className="section-head">
              <span className="section-title">Badges</span>
              <span className="section-aside">9-point scale</span>
            </div>
            <div className="ds-badges">
              <span className="pain-badge sm low">2</span>
              <span className="pain-badge sm mid">5</span>
              <span className="pain-badge sm high">8</span>
              <span className="pain-badge sm muted">&mdash;</span>
            </div>
          </section>
        </div>

        <div className="panel-col ds-col">
          <h2 className="entries-heading">Components</h2>

          <section className="ds-section">
            <div className="section-head">
              <span className="section-title">Buttons</span>
              <span className="section-aside">Pill utility</span>
            </div>
            <div className="ds-btn-row">
              <button type="button" className="btn">Default</button>
              <button type="button" className="btn btn-primary">Primary</button>
              <button type="button" className="btn btn-primary is-success-pulse">✓ Saved</button>
              <button type="button" className="btn btn-danger">Danger</button>
            </div>
          </section>

          <section className="ds-section">
            <div className="section-head">
              <span className="section-title">Sidebar nav</span>
              <span className="section-aside">.sidebar-item</span>
            </div>
            <p className="hint ds-sidebar-preview-note">
              Uses production classes. Default → hover <code>card-strong</code>; <code>active</code> → accent tint.
            </p>
            <div className="ds-sidebar-preview">
              <button type="button" className="sidebar-item" tabIndex={-1}>
                {DS_SIDEBAR_DEMO_ICON}
                <span className="sidebar-item-label">Dashboard</span>
              </button>
              <button type="button" className="sidebar-item active" tabIndex={-1}>
                {DS_SIDEBAR_DEMO_ICON}
                <span className="sidebar-item-label">Settings</span>
              </button>
            </div>
          </section>

          <section className="ds-section">
            <div className="section-head">
              <span className="section-title">Form fields</span>
              <span className="section-aside">Field-line</span>
            </div>
            <div className="ds-fields">
              <label className="field field-line">
                <span className="field-line-label">Text</span>
                <input type="text" defaultValue="Sample value" aria-label="Text" />
              </label>
              <label className="field field-line">
                <span className="field-line-label">Date &amp; time</span>
                <input type="datetime-local" defaultValue="2026-04-18T17:30" aria-label="Date/time" />
              </label>
              <label className="field field-line">
                <span className="field-line-label">Description</span>
                <textarea rows={2} placeholder="Free text area…" aria-label="Description" />
              </label>
            </div>
          </section>

          <section className="ds-section">
            <div className="section-head">
              <span className="section-title">Metrics</span>
              <span className="section-aside">BarMetric · Stepper</span>
            </div>
            <div className="ds-metrics">
              <BarMetric label="Mood" value={moodDemo} fractionDigits={1} higherIsBetter onChange={setMoodDemo} />
              <BarMetric label="Pain" value={painDemo} onChange={setPainDemo} />
              <CoffeeStepper value={coffeeDemo} onChange={setCoffeeDemo} />
            </div>
          </section>

          <section className="ds-section">
            <div className="section-head">
              <span className="section-title">Tabs</span>
              <span className="section-aside">Underline, accent</span>
            </div>
            <nav className="tag-tabs" role="tablist" aria-label="Demo tabs">
              {(["positive", "negative", "general"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tabDemo === id}
                  className={tabDemo === id ? "active" : ""}
                  onClick={() => setTabDemo(id)}
                >
                  {id[0].toUpperCase() + id.slice(1)} <span className="count">0</span>
                </button>
              ))}
            </nav>
          </section>

          <section className="ds-section">
            <div className="section-head">
              <span className="section-title">Entry row</span>
              <span className="section-aside">Collapsible details</span>
            </div>
            <details className="entry-row" open>
              <summary>
                <span className="date">Apr 18, 5:03 PM</span>
                <span className="pain-badge sm mid">6</span>
                <span className="preview">grateful · distracted, restless</span>
                <span />
                <span className="chevron" aria-hidden="true">▶</span>
              </summary>
              <div className="entry-expanded">
                <div className="detail-group">
                  <span className="label">Mood · Dep · Anx</span>
                  <span className="value">6 · 4 · 4</span>
                </div>
                <div className="detail-group">
                  <span className="label">Positive</span>
                  <span className="value">
                    <span className="tag-mini">grateful</span>
                  </span>
                </div>
              </div>
            </details>
          </section>

          <section className="ds-section">
            <div className="section-head">
              <span className="section-title">Memorable days</span>
              <span className="section-aside">Calendar · list · emoji</span>
            </div>
            <div className="ds-memorable-stack">
              <div className="memorable-calendar-head">
                <div className="memorable-calendar-nav">
                  <button type="button" className="btn memorable-month-nav">
                    Prev
                  </button>
                  <button type="button" className="btn memorable-month-label" aria-label="Go to current month (demo)">
                    May 2026
                  </button>
                  <button type="button" className="btn memorable-month-nav">
                    Next
                  </button>
                </div>
              </div>
              <button type="button" className="btn btn-primary memorable-add-btn">
                Add new
              </button>
              <div className="memorable-weekdays">
                {DS_MEMORABLE_WEEKDAY_LABELS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="ds-memorable-calendar-preview">
                <div className="memorable-calendar-grid">
                  <div className="memorable-day-cell is-outside">
                    <span className="memorable-day-top">
                      <button type="button" className="memorable-day-number" tabIndex={-1} onClick={(e) => e.preventDefault()}>
                        27
                      </button>
                    </span>
                  </div>
                  <div className="memorable-day-cell is-today">
                    <span className="memorable-day-top">
                      <button type="button" className="memorable-day-number" tabIndex={-1} onClick={(e) => e.preventDefault()}>
                        28
                      </button>
                    </span>
                  </div>
                  <div className="memorable-day-cell">
                    <span className="memorable-day-top">
                      <button type="button" className="memorable-day-number" tabIndex={-1} onClick={(e) => e.preventDefault()}>
                        29
                      </button>
                    </span>
                    <span className="memorable-day-markers">
                      <span className="memorable-day-marker">Team lunch</span>
                    </span>
                  </div>
                  <div className="memorable-day-cell">
                    <span className="memorable-day-top">
                      <button type="button" className="memorable-day-number" tabIndex={-1} onClick={(e) => e.preventDefault()}>
                        30
                      </button>
                    </span>
                  </div>
                  <div className="memorable-day-cell">
                    <span className="memorable-day-top">
                      <button type="button" className="memorable-day-number" tabIndex={-1} onClick={(e) => e.preventDefault()}>
                        1
                      </button>
                    </span>
                  </div>
                  <div className="memorable-day-cell">
                    <span className="memorable-day-top">
                      <button type="button" className="memorable-day-number" tabIndex={-1} onClick={(e) => e.preventDefault()}>
                        2
                      </button>
                    </span>
                  </div>
                  <div className="memorable-day-cell">
                    <span className="memorable-day-top">
                      <button type="button" className="memorable-day-number" tabIndex={-1} onClick={(e) => e.preventDefault()}>
                        3
                      </button>
                    </span>
                  </div>
                </div>
              </div>
              <button type="button" className="memorable-list-item">
                <span className="memorable-list-emoji">🎂</span>
                <span className="memorable-list-body">
                  <span className="memorable-list-topline">
                    <strong>Sample day</strong>
                    <span className="memorable-list-date">05-15</span>
                  </span>
                  <span className="memorable-list-meta">yearly</span>
                </span>
              </button>
              <div className="ds-memorable-emoji-row">
                <button type="button" className="btn memorable-emoji-picker-trigger" aria-label="Emoji picker trigger demo">
                  <span className="memorable-emoji-picker-trigger-emoji" aria-hidden>
                    ✨
                  </span>
                </button>
                <p className="hint">Same trigger class as the modal emoji control.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
