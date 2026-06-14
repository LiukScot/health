import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "default" | "primary" | "danger" | "success";
export type ButtonSize = "md" | "sm";

// Pill button (former .btn / .btn-primary / .btn-danger / .is-success-pulse).
// Shape carries no color so per-variant color/hover never collide on source order.
const COMMON =
  "font-semibold font-body border-0 rounded-full cursor-pointer shadow-none transition-[background,color] duration-150 ease-[ease] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent)_38%,transparent)]";

const SIZE: Record<ButtonSize, string> = {
  md: "px-block py-stack min-h-[40px] text-sm",
  sm: "inline-flex items-center justify-center px-[14px] py-[6px] min-h-[34px] text-control",
};

const VARIANT: Record<ButtonVariant, string> = {
  default:
    "text-text bg-card-soft hover:text-text hover:bg-[color-mix(in_srgb,var(--text)_4%,var(--card-soft))]",
  primary:
    "text-accent bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] hover:text-text hover:bg-[color-mix(in_srgb,var(--accent)_22%,transparent)]",
  danger:
    "text-danger bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] hover:text-text hover:bg-[color-mix(in_srgb,var(--danger)_22%,transparent)]",
  success: "text-success bg-[color-mix(in_srgb,var(--success)_14%,transparent)]",
};

// Shared so non-<button> controls (e.g. a file-input <label>) can wear the pill.
// eslint-disable-next-line react-refresh/only-export-components
export function buttonClass(variant: ButtonVariant = "default", size: ButtonSize = "md", extra = "") {
  return `${COMMON} ${SIZE[size]} ${VARIANT[variant]} ${extra}`;
}

export function Button({
  variant = "default",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}
