"use client";

import { Type } from "lucide-react";
import { useState } from "react";
import { IconButton } from "@/components/ui/button";
import type { LiveConsole } from "../use-live-console";
import { TypographyDialog } from "./typography-dialog";

/** "Texto": next to the background, opens how the lyrics look. */
export function TypographyButton({ ctrl }: { ctrl: LiveConsole }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <IconButton label="Texto: fuente y tamaño de la letra" onClick={() => setIsOpen(true)}>
        <Type />
      </IconButton>
      {isOpen && <TypographyDialog ctrl={ctrl} onClose={() => setIsOpen(false)} />}
    </>
  );
}
