import { cn } from "@/lib/cn";

export function IrisLogo({ className }: { className?: string }) {
  return <img src="/brand/iris-logo.svg" alt="Iris" className={cn("h-8 w-auto", className)} />;
}
