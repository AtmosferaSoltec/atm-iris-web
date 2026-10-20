"use client";

import { useEffect, useState } from "react";
import { IrisWordmark } from "@/components/brand/iris-mark";
import { ScreenView } from "./screen-view";

type Mode = "remote" | "local" | "pairing";

/** Which screen this is: a linked TV, a window next to the console, or one still to link. */
export function DisplayRoot({
  churchId,
  isLinked,
}: {
  churchId: string | null;
  isLinked: boolean;
}) {
  const [mode, setMode] = useState<Mode>(isLinked ? "remote" : churchId ? "local" : "pairing");

  if (mode === "remote") {
    return (
      <ScreenView
        source={{ kind: "remote" }}
        onUnlinked={() => setMode(churchId ? "local" : "pairing")}
      />
    );
  }
  if (mode === "local" && churchId) {
    return (
      <ScreenView source={{ kind: "local", churchId }} onLinkInstead={() => setMode("pairing")} />
    );
  }
  return <PairingScreen onLinked={() => setMode("remote")} />;
}

type Pairing = { code: string } | { error: string } | null;

/** How often the TV asks whether someone typed its code. */
const POLL_MS = 2000;

/**
 * Like linking Netflix on a TV: a big code to type in the console ("Pantallas").
 * Once linked, this browser remembers it and goes straight to the projection next time.
 */
function PairingScreen({ onLinked }: { onLinked: () => void }) {
  const [pairing, setPairing] = useState<Pairing>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let stopped = false;
    let poll: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      const response = await fetch("/api/display/pairing").catch(() => null);
      const result = (await response?.json().catch(() => null)) as { status?: string } | null;
      if (stopped) return;
      if (result?.status === "paired") onLinked();
      // Ten minutes passed: a new code.
      else if (result?.status === "expired") setAttempt((value) => value + 1);
      else poll = setTimeout(check, POLL_MS);
    };

    void fetch("/api/display/pairing", { method: "POST" })
      .then((response) => response.json() as Promise<{ code?: string; error?: string }>)
      .then((result) => {
        if (stopped) return;
        if (result.code) {
          setPairing({ code: result.code });
          poll = setTimeout(check, POLL_MS);
        } else {
          setPairing({ error: result.error ?? "No pudimos conectar con Iris." });
          poll = setTimeout(() => setAttempt((value) => value + 1), 5000);
        }
      })
      .catch(() => {
        if (stopped) return;
        setPairing({ error: "Sin conexión a internet. Reintentando…" });
        poll = setTimeout(() => setAttempt((value) => value + 1), 5000);
      });

    return () => {
      stopped = true;
      clearTimeout(poll);
    };
  }, [attempt, onLinked]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-[5vh] bg-black px-8 text-center text-white">
      <IrisWordmark height={44} />
      <div className="flex flex-col items-center gap-[3vh]">
        <p className="text-[2.4vw] leading-tight text-white/75">
          Para conectar esta pantalla, abre Iris en tu computadora, toca{" "}
          <strong className="text-white">Pantallas</strong> y escribe:
        </p>
        {pairing && "code" in pairing ? (
          <p
            aria-label={`Código ${pairing.code.split("").join(" ")}`}
            className="font-mono text-[11vw] leading-none font-bold tracking-[0.18em] tabular-nums"
          >
            {pairing.code}
          </p>
        ) : pairing && "error" in pairing ? (
          <p className="text-[2vw] text-white/60">{pairing.error}</p>
        ) : (
          <p className="font-mono text-[11vw] leading-none font-bold tracking-[0.18em] text-white/15">
            ······
          </p>
        )}
      </div>
      <p className="text-[1.4vw] text-white/45">
        El código cambia cada 10 minutos. Solo se hace una vez: después este televisor se conecta
        solo.
      </p>
    </div>
  );
}
