import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export function BackLink({ href, children }: { href: Route; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-2 transition hover:text-ink"
    >
      <ArrowLeft aria-hidden className="size-4" />
      {children}
    </Link>
  );
}
