import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-accent text-ink-inverse shadow-[0_10px_30px_-8px_rgb(255_122_89/0.55)] hover:brightness-105",
  secondary: "bg-surface text-ink ring-1 ring-line-strong ring-inset hover:bg-surface-raised",
  ghost: "text-ink-2 hover:text-ink",
} as const;

const sizes = {
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-7 text-base",
} as const;

export type ButtonStyle = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
};

/** Las clases de un botón, para usarlas también en enlaces. */
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyle = {}): string {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition duration-200 ease-(--ease-calm) active:scale-[0.98] aria-disabled:pointer-events-none aria-disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}
