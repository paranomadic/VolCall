import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

export function Button({
  className = "",
  variant = "primary",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-50";
  const styles = {
    primary:
      "bg-[var(--accent)] text-[#04120e] hover:brightness-110 active:brightness-95",
    ghost: "bg-transparent text-[var(--foreground)] hover:bg-white/5",
    outline:
      "border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-white/5",
  };
  return (
    <button
      type="button"
      className={`${base} ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
