"use client";

import { greeting, longDateOverline } from "@/lib/format";

/** Rendered with the visitor's clock, not the server's (which may be in another time zone). */
export function Greeting({ churchName }: { churchName: string }) {
  const now = new Date();
  return (
    <header className="flex flex-col gap-3">
      <p className="w-fit text-accent eyebrow" suppressHydrationWarning>
        {longDateOverline(now)}
      </p>
      <h1 className="font-serif text-4xl leading-tight font-medium tracking-tight sm:text-[44px]">
        <span suppressHydrationWarning>{greeting(now)}</span>
        <br />
        <span className="text-accent">{churchName}</span>
      </h1>
      <p className="text-[15px] text-ink-2">
        Prepara las letras, los servicios y los equipos de esta semana.
      </p>
    </header>
  );
}
