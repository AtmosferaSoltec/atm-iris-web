import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Panel de vidrio esmerilado, como los de la aplicación. */
export function Surface({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-elevated/70 shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_24px_40px_-12px_rgb(0_0_0/0.45)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
