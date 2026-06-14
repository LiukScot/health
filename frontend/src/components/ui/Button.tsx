import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "default" | "primary" | "danger" | "success";

// Pill button (former .btn / .btn-primary / .btn-danger / .is-success-pulse).
// Shape carries no color so per-variant color/hover never collide on source order.
const BASE =
  "px-block py-stack min-h-[40px] font-semibold text-sm font-body border-0 rounded-full cursor-pointer shadow-none transition-[background,color] duration-150 ease-[ease] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent)_38%,transparent)]";

const VARIANT: Record<ButtonVariant, string> = {
  default:
    "text-text bg-card-soft hover:text-text hover:bg-[color-mix(in_srgb,var(--text)_4%,var(--card-soft))]",
  primary:
    "text-accent bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] hover:text-text hover:bg-[color-mix(in_srgb,var(--accent)_22%,transparent)]",
  danger:
    "text-danger bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] hover:text-text hover:bg-[color-mix(in_srgb,var(--danger)_22%,transparent)]",
  success: "text-success bg-[color-mix(in_srgb,var(--success)_14%,transparent)]",
};

export function Button({
  variant = "default",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`${BASE} ${VARIANT[variant]} ${className}`} {...props} />;
}
