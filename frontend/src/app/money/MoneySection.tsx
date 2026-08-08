import { navLabels, type NavItem } from "../core";
import { EmptyState } from "../screen-helpers";

// Placeholder shell for the Money realm. Each panel is ported from the
// standalone money app one at a time; until its turn comes it renders here.
export function MoneySection({ nav }: { nav: NavItem }) {
  return (
    <section>
      <h1 className="m-0 mb-3 text-title font-bold tracking-tight text-text">{navLabels[nav]}</h1>
      <EmptyState
        title="Not migrated yet"
        description="This panel still lives in the standalone money app. It lands here once its port is done."
      />
    </section>
  );
}
