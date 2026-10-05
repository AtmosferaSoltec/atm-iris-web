import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Frosted panel for content (IrisSurface). */
export function Surface({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl surface-panel", className)} {...props} />;
}
