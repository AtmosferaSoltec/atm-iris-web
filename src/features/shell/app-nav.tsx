"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ChurchModules } from "@/domain/models";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav-items";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({ modules }: { modules: ChurchModules }) {
  const pathname = usePathname();
  // The clicked item lights up at once; the page follows when the server answers.
  const [clicked, setClicked] = useState<{ href: string; from: string }>();
  if (clicked && clicked.from !== pathname) setClicked(undefined);
  const target = clicked?.href ?? pathname;
  const items = NAV_ITEMS.filter((item) => !item.module || modules[item.module]);

  return (
    <nav
      aria-label="Principal"
      className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(target, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setClicked({ href, from: pathname })}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-10 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              active ? "bg-surface-raised text-ink" : "text-ink-2 hover:bg-surface hover:text-ink",
            )}
          >
            {active && (
              <span
                aria-hidden
                className="absolute inset-y-2 left-0 hidden w-[3px] rounded-full bg-accent lg:block"
              />
            )}
            <Icon aria-hidden className="size-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
