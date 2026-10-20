"use client";

import { Type } from "lucide-react";
import { useState } from "react";
import type { LiveConsole } from "../use-live-console";
import { TypographyDialog } from "./typography-dialog";

/** "Texto": a pill like Biblia and Pantallas, opens how the lyrics look. */
export function TypographyButton({ ctrl }: { ctrl: LiveConsole }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="Fuente y tamaño de la letra"
        className="flex h-10 cursor-pointer items-center gap-2.5 rounded-full px-4 text-sm font-medium text-ink ring-1 ring-line transition ring-inset hover:bg-surface"
      >
        <Type aria-hidden className="size-4 text-ink-2" />
        Texto
      </button>
      {isOpen && <TypographyDialog ctrl={ctrl} onClose={() => setIsOpen(false)} />}
    </>
  );
}
