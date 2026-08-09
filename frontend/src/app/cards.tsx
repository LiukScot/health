// Dashboard stat card. Shared by the health and money dashboards, which show
// different numbers in the same shape.
export const DASH_CARD =
  "grid grid-rows-[auto_auto_22px] gap-2 content-start w-full max-w-[200px] justify-self-start rounded-md p-3 bg-card-soft";
export const CARD_H3 =
  "m-0 text-nano font-bold tracking-[0.12em] uppercase text-muted leading-tight whitespace-nowrap overflow-hidden text-ellipsis translate-y-0.5";
// Deliberately colourless: a caller that wants a tinted value would
// otherwise put two text-* utilities on one element, where the winner is
// decided by their order in the generated CSS rather than by intent.
export const CARD_VALUE = "text-lg font-bold translate-y-0.5";
