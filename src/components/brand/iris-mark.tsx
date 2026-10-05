import Image from "next/image";
import { cn } from "@/lib/cn";

/** The logo symbol: spectrum ring + glint, stacked in the same square box. */
export function IrisMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Image src="/brand/iris-ring.svg" alt="" fill unoptimized priority />
      <Image src="/brand/iris-glint.svg" alt="" fill unoptimized priority />
    </span>
  );
}

/** Symbol + "iris" wordmark (aspect 2.564 : 1). */
export function IrisWordmark({ height = 28, className }: { height?: number; className?: string }) {
  return (
    <Image
      src="/brand/iris-logo.svg"
      alt="Iris"
      width={Math.round(height * 2.564)}
      height={height}
      unoptimized
      priority
      className={className}
    />
  );
}
