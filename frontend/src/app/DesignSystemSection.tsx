import { useState } from "react";
import { BarMetric, CoffeeStepper } from "./screen-helpers";
import { Button } from "../components/ui/Button";
import { FieldLine } from "../components/ui/FieldLine";
import { SectionHead } from "./shared";
import { NAV_ITEM, NAV_ITEM_ACTIVE, NAV_ITEM_IDLE } from "./Sidebar";
import { DAY_NUMBER, EMOJI_TRIGGER, MEMO_DAY_CELL, MEMO_LIST_ITEM } from "./memorable-days";
import {
  DetailGroup,
  EntriesHeading,
  ENTRY_CHEVRON,
  ENTRY_DATE,
  ENTRY_EXPANDED,
  ENTRY_PREVIEW,
  ENTRY_ROW,
  ENTRY_SUMMARY,
  PainBadge,
  TAG_MINI,
  TagTabs,
} from "./entries";


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
  { varName: "--spacing-tight", px: "4px" },
  { varName: "--spacing-inline", px: "8px" },
  { varName: "--spacing-stack", px: "12px" },
  { varName: "--spacing-block", px: "20px" },
  { varName: "--spacing-page", px: "30px" },
  { varName: "--spacing-split", px: "48px" },
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
    <section className="@container p-inline">
      <h1 className="m-0 mb-stack text-[22px] font-bold tracking-tight text-text">Design System</h1>
      <p className="text-muted text-control mt-inline mb-block max-w-[72ch] [&_code]:px-[6px] [&_code]:py-[1px] [&_code]:rounded-[6px] [&_code]:bg-card-soft [&_code]:text-text">
        Living reference for tokens, primitives, and patterns used across Diary, Pain, therapy forms, and Memorable days.
        Examples use the same classes as production &mdash; edit <code>styles.css</code> and this page tracks it.
      </p>

      <div className="grid gap-page mt-page items-start min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[1100px]:gap-split">
        <div className="block min-w-0 [&>section+section]:mt-stack">
          <EntriesHeading className="mt-0 mb-block">Foundations</EntriesHeading>

          <section className="flex flex-col gap-stack">
            <SectionHead title="Colors" aside="CSS custom properties" variant="ds" />
            <ul className="list-none m-0 p-0 grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-stack">
              {DESIGN_COLOR_TOKENS.map((t) => (
                <li key={t.varName} className="flex items-center gap-stack p-inline rounded-sm bg-card-soft">
                  <span className="w-[32px] h-[32px] rounded-[8px] flex-shrink-0" style={{ background: `var(${t.varName})` }} />
                  <div className="flex flex-col gap-[2px] min-w-0">
                    <span className="text-xs font-semibold text-text">{t.name}</span>
                    <code className="text-micro text-muted">{t.varName}</code>
                    <span className="text-micro text-muted-soft">{t.role}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-stack">
            <SectionHead title="Typography" aside="Manrope" variant="ds" />
            <dl className="m-0 flex flex-col gap-stack">
              <div className="flex flex-col gap-[2px] py-[2px] [&_dt]:m-0 [&_dt]:min-w-0 [&_dd]:m-0 [&_dd]:text-micro [&_dd]:text-muted-soft">
                <dt style={{ font: "700 28px var(--font-body)" }}>Panel title</dt>
                <dd>28 / 700</dd>
              </div>
              <div className="flex flex-col gap-[2px] py-[2px] [&_dt]:m-0 [&_dt]:min-w-0 [&_dd]:m-0 [&_dd]:text-micro [&_dd]:text-muted-soft">
                <dt style={{ font: "700 10px var(--font-body)", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)" }}>
                  Entries heading
                </dt>
                <dd>10 / 700 / 0.16em</dd>
              </div>
              <div className="flex flex-col gap-[2px] py-[2px] [&_dt]:m-0 [&_dt]:min-w-0 [&_dd]:m-0 [&_dd]:text-micro [&_dd]:text-muted-soft">
                <dt style={{ font: "500 14px var(--font-body)" }}>Body</dt>
                <dd>14 / 500</dd>
              </div>
              <div className="flex flex-col gap-[2px] py-[2px] [&_dt]:m-0 [&_dt]:min-w-0 [&_dd]:m-0 [&_dd]:text-micro [&_dd]:text-muted-soft">
                <dt style={{ font: "500 12px var(--font-body)", color: "var(--muted)" }}>Hint</dt>
                <dd>12 / 500 / muted</dd>
              </div>
              <div className="flex flex-col gap-[2px] py-[2px] [&_dt]:m-0 [&_dt]:min-w-0 [&_dd]:m-0 [&_dd]:text-micro [&_dd]:text-muted-soft">
                <dt style={{ font: "500 12px var(--font-mono, ui-monospace, Menlo, monospace)", fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>
                  Entry date · Apr 18, 5:03 PM
                </dt>
                <dd>12 / mono / tabular</dd>
              </div>
            </dl>
          </section>

          <section className="flex flex-col gap-stack">
            <SectionHead title="Spacing" aside="Layout tokens" variant="ds" />
            <p className="text-muted text-control m-0 mb-stack max-w-[62ch] [&_code]:px-[6px] [&_code]:py-[1px] [&_code]:rounded-[6px] [&_code]:bg-card-soft [&_code]:text-text">
              Use named steps from <code>--spacing-tight</code> (4px) through <code>--spacing-split</code> — no numbered scale; bar length matches each variable.
            </p>
            <ul className="list-none m-0 p-0 flex flex-col gap-inline">
              {DESIGN_SPACING_TOKENS.map((t) => (
                <li key={t.varName} className="grid grid-cols-[minmax(13rem,auto)_3rem_minmax(0,1fr)] items-center gap-inline text-micro text-muted [&_code]:text-micro [&_code]:text-muted-soft">
                  <code>{t.varName}</code>
                  <span className="text-micro text-muted tabular-nums">{t.px}</span>
                  <span className="h-[8px] bg-accent rounded-[4px] max-w-full min-w-0" style={{ width: `var(${t.varName})` }} aria-hidden title={t.varName} />
                </li>
              ))}
            </ul>
            <div className="max-w-[320px]">
              <p className="mt-stack mb-inline text-control font-semibold text-text">Field-line (label ↔ control)</p>
              <FieldLine label="Example" type="text" defaultValue="Spacing demo" aria-label="Field-line spacing demo" />
              <p className="mt-[10px] text-micro text-muted-soft leading-normal max-w-[42ch] [&_code]:text-muted">
                <code>.field-line</code> stacks an uppercase micro-label over a borderless tinted control, with{" "}
                <strong>gap-inline</strong> between them — the same primitive the production forms use.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-stack">
            <SectionHead title="Radius" aside="Rounded corners" variant="ds" />
            <ul className="list-none m-0 p-0 flex flex-wrap gap-stack">
              {DESIGN_RADIUS_TOKENS.map((t) => (
                <li key={t.varName} className="flex flex-col items-center gap-tight text-micro text-muted">
                  <span className="w-[54px] h-[54px] bg-card-strong" style={{ borderRadius: `var(${t.varName})` }} />
                  <code>{t.varName}</code>
                  <span className="text-muted-soft tabular-nums">{t.px}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-stack">
            <SectionHead title="Badges" aside="9-point scale" variant="ds" />
            <div className="flex gap-inline flex-wrap">
              <PainBadge variant="low" sm>2</PainBadge>
              <PainBadge variant="mid" sm>5</PainBadge>
              <PainBadge variant="high" sm>8</PainBadge>
              <PainBadge variant="muted" sm>&mdash;</PainBadge>
            </div>
          </section>
        </div>

        <div className="block min-w-0 [&>section+section]:mt-stack min-[1100px]:border-l min-[1100px]:border-[var(--border-soft)] min-[1100px]:pl-split">
          <EntriesHeading className="mt-0 mb-block">Components</EntriesHeading>

          <section className="flex flex-col gap-stack">
            <SectionHead title="Buttons" aside="Pill utility" variant="ds" />
            <div className="flex gap-inline flex-wrap">
              <Button>Default</Button>
              <Button variant="primary">Primary</Button>
              <Button variant="success">✓ Saved</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </section>

          <section className="flex flex-col gap-stack">
            <SectionHead title="Sidebar nav" aside=".sidebar-item" variant="ds" />
            <p className="m-0 text-micro text-muted-soft leading-snug [&_code]:text-muted">
              Uses production classes. Default → hover <code>card-strong</code>; <code>active</code> → accent tint.
            </p>
            <div className="max-w-[220px] flex flex-col gap-stack">
              <button type="button" className={`${NAV_ITEM} ${NAV_ITEM_IDLE}`} tabIndex={-1}>
                {DS_SIDEBAR_DEMO_ICON}
                <span className="opacity-100">Dashboard</span>
              </button>
              <button type="button" className={`${NAV_ITEM} ${NAV_ITEM_ACTIVE}`} tabIndex={-1}>
                {DS_SIDEBAR_DEMO_ICON}
                <span className="opacity-100">Settings</span>
              </button>
            </div>
          </section>

          <section className="flex flex-col gap-stack">
            <SectionHead title="Form fields" aside="Field-line" variant="ds" />
            <div className="flex flex-col gap-stack">
              <FieldLine label="Text" type="text" defaultValue="Sample value" aria-label="Text" />
              <FieldLine label="Date & time" type="datetime-local" defaultValue="2026-04-18T17:30" aria-label="Date/time" className="!w-auto justify-self-start" />
              <FieldLine label="Description" multiline rows={2} placeholder="Free text area…" aria-label="Description" />
            </div>
          </section>

          <section className="flex flex-col gap-stack">
            <SectionHead title="Metrics" aside="BarMetric · Stepper" variant="ds" />
            <div className="flex flex-col gap-inline">
              <BarMetric label="Mood" value={moodDemo} fractionDigits={1} higherIsBetter onChange={setMoodDemo} />
              <BarMetric label="Pain" value={painDemo} onChange={setPainDemo} />
              <CoffeeStepper value={coffeeDemo} onChange={setCoffeeDemo} />
            </div>
          </section>

          <section className="flex flex-col gap-stack">
            <SectionHead title="Tabs" aside="Underline, accent" variant="ds" />
            <TagTabs
              tabs={(["positive", "negative", "general"] as const).map((id) => ({ id, label: id[0].toUpperCase() + id.slice(1), count: 0 }))}
              active={tabDemo}
              onSelect={setTabDemo}
              ariaLabel="Demo tabs"
            />
          </section>

          <section className="flex flex-col gap-stack">
            <SectionHead title="Entry row" aside="Collapsible details" variant="ds" />
            <details className={ENTRY_ROW} open>
              <summary className={ENTRY_SUMMARY}>
                <span className={ENTRY_DATE}>Apr 18, 5:03 PM</span>
                <PainBadge variant="mid" sm>6</PainBadge>
                <span className={ENTRY_PREVIEW}>grateful · distracted, restless</span>
                <span />
                <span className={ENTRY_CHEVRON} aria-hidden="true">▶</span>
              </summary>
              <div className={ENTRY_EXPANDED}>
                <DetailGroup label="Mood · Dep · Anx">6 · 4 · 4</DetailGroup>
                <DetailGroup label="Positive"><span className={TAG_MINI}>grateful</span></DetailGroup>
              </div>
            </details>
          </section>

          <section className="flex flex-col gap-stack">
            <SectionHead title="Memorable days" aside="Calendar · list · emoji" variant="ds" />
            <div className="flex flex-col gap-stack items-stretch">
              <div className="flex items-center">
                <div className="flex gap-inline items-center">
                  <Button className="flex-shrink-0 tracking-[0.01em]">Prev</Button>
                  <Button className="tracking-[0.01em] min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap" aria-label="Go to current month (demo)">May 2026</Button>
                  <Button className="flex-shrink-0 tracking-[0.01em]">Next</Button>
                </div>
              </div>
              <Button variant="primary">Add new</Button>
              <div className="flex items-center gap-inline mb-inline">
                {DS_MEMORABLE_WEEKDAY_LABELS.map((d) => (
                  <span key={d} className="flex-1 text-center text-muted text-xs font-bold uppercase">{d}</span>
                ))}
              </div>
              <div className="max-w-[480px] w-full">
                <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-inline">
                  {[
                    { n: 27, mod: "opacity-[0.48]" },
                    { n: 28, mod: "shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_28%,transparent)]" },
                    { n: 29, marker: "Team lunch" },
                    { n: 30 }, { n: 1 }, { n: 2 }, { n: 3 },
                  ].map((cell) => (
                    <div key={cell.n} className={`${MEMO_DAY_CELL} !min-h-[72px] !p-inline ${cell.mod ?? ""}`}>
                      <span className="flex items-center justify-between">
                        <button type="button" className={DAY_NUMBER} tabIndex={-1} onClick={(e) => e.preventDefault()}>{cell.n}</button>
                      </span>
                      {cell.marker ? (
                        <span className="flex flex-col gap-inline">
                          <span className="text-xs leading-snug text-muted whitespace-nowrap overflow-hidden text-ellipsis">{cell.marker}</span>
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              <button type="button" className={MEMO_LIST_ITEM}>
                <span className="text-[22px] leading-none">🎂</span>
                <span className="flex-1 flex flex-col gap-tight items-start">
                  <span className="w-full flex items-baseline justify-between gap-stack">
                    <strong className="text-base min-w-0 text-text">Sample day</strong>
                    <span className="text-muted text-control flex-shrink-0 text-right">05-15</span>
                  </span>
                  <span className="text-micro text-muted-soft">yearly</span>
                </span>
              </button>
              <div className="flex items-center gap-inline flex-wrap">
                <button type="button" className={EMOJI_TRIGGER} aria-label="Emoji picker trigger demo">
                  <span className="text-[32px] leading-none" aria-hidden>✨</span>
                </button>
                <p className="m-0 text-micro text-muted">Same trigger class as the modal emoji control.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
