import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import { navItemsByRealm, navLabels } from "./core";

const noop = () => {};

function renderSidebar(nav: Parameters<typeof Sidebar>[0]["nav"]) {
  return render(
    <Sidebar
      nav={nav}
      onNav={noop}
      realm="health"
      onRealmChange={noop}
      collapsed={false}
      onToggle={noop}
      onCloseMobile={noop}
      mobileOpen={false}
    />,
  );
}

describe("<Sidebar />", () => {
  test("marks the active nav item with aria-current, and only that one", () => {
    renderSidebar("pain");

    expect(screen.getByRole("button", { name: navLabels.pain })).toHaveAttribute("aria-current", "page");

    for (const item of navItemsByRealm.health.filter((i) => i !== "pain")) {
      expect(screen.getByRole("button", { name: navLabels[item] })).not.toHaveAttribute("aria-current");
    }
  });

  test("moves aria-current with the active item", () => {
    renderSidebar("diary");

    expect(screen.getByRole("button", { name: navLabels.diary })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: navLabels.pain })).not.toHaveAttribute("aria-current");
  });
});
