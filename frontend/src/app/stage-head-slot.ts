import { createContext } from "react";

/*
 * The shell owns the mobile sticky head; the stage steps are derived from
 * form state inside each screen. Rather than lift that state up — the
 * shell would need every screen's form to compute it — the shell exposes
 * this slot and the screen portals its progress dots into it.
 *
 * Its own file because a module that exports both a context and
 * components breaks fast refresh.
 */
export const StageHeadSlot = createContext<HTMLElement | null>(null);
