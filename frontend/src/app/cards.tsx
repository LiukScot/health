// Dashboard stat card. Shared by the health and money dashboards, which show
// different numbers in the same shape.
// The card fills its grid track. It used to cap itself at 200px and pin
// left, which left track-width minus 200 as dead space — a gap that grew
// as the row held fewer cards, so two rows of different length never lined
// up. Size the track instead: CARD_GRID.
export const DASH_CARD =
  "grid gap-2 content-start w-full rounded-md p-3 bg-card-soft";


// auto-fill, not auto-fit: auto-fit collapses the unused tracks and stretches
// what is left, so track width would depend on how many cards a row happens
// to hold. auto-fill keeps them, so every row lands on the same grid.
export const CARD_GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,160px),1fr))] gap-3";
export const CARD_H3 =
  "m-0 text-nano font-bold tracking-[0.12em] uppercase text-muted leading-tight whitespace-nowrap overflow-hidden text-ellipsis translate-y-0.5";
// Deliberately colourless: a caller that wants a tinted value would
// otherwise put two text-* utilities on one element, where the winner is
// decided by their order in the generated CSS rather than by intent.
export const CARD_VALUE = "text-lg font-bold translate-y-0.5";
