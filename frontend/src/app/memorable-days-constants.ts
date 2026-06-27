export const MEMO_BACKDROP =
  "fixed inset-0 bg-scrim [backdrop-filter:blur(6px)] grid place-items-center p-5 z-40";
export const MEMO_MODAL = "w-[min(520px,100%)] p-5 flex flex-col gap-3 bg-card border-0 rounded-md shadow-none";
export const MEMO_DAY_CELL =
  "min-h-[108px] p-3 rounded-md bg-card-soft text-text text-left flex flex-col gap-2 relative transition-[background,color] duration-150 ease-[ease] hover:bg-[color-mix(in_srgb,var(--text)_4%,var(--card-soft))]";
export const MEMO_LIST_ITEM =
  "flex items-center justify-between flex-[0_0_auto] w-full gap-3 p-3 rounded-md border-0 bg-card-soft text-text shadow-none hover:bg-[color-mix(in_srgb,var(--text)_4%,var(--card-soft))]";
export const MEMO_MODAL_ACTIONS = "flex items-center gap-3 justify-end flex-wrap";
export const DAY_NUMBER =
  "bg-transparent border-0 shadow-none min-h-0 p-0 font-[inherit] text-[inherit] cursor-pointer leading-none";
export const EMOJI_TRIGGER =
  "min-w-0 min-h-0 p-0 rounded-none inline-flex items-center justify-center bg-transparent border border-transparent text-text shadow-none cursor-pointer focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--ring)]";
