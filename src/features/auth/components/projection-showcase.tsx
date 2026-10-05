"use client";

import { useEffect, useState } from "react";

const SAMPLES = [
  {
    text: "Sublime gracia del Señor\nque a un pecador salvó",
    footnote: "Sublime gracia · Estrofa 1",
  },
  {
    text: "Lámpara es a mis pies tu palabra,\ny lumbrera a mi camino.",
    footnote: "Salmos 119:105",
  },
  { text: "¡Santo, santo, santo!\nSeñor omnipotente", footnote: "Santo, santo, santo" },
  {
    text: "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.",
    footnote: "Mateo 11:28",
  },
];

/** Mini TV on the login hero. Rotates every 5 s (IRIS_SPEC §6.1). */
export function ProjectionShowcase() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((value) => (value + 1) % SAMPLES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const sample = SAMPLES[index];

  return (
    <div className="@container relative aspect-video w-full max-w-[440px] overflow-hidden rounded-lg bg-black shadow-[0_30px_60px_-20px_rgb(155_92_255/0.3)] ring-1 ring-line-strong">
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgb(42_22_88/0.9),transparent)]" />
      <span className="absolute top-[4cqw] left-[4cqw] inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-ink ring-1 ring-line backdrop-blur">
        <span className="size-1.5 animate-pulse-live rounded-full bg-live" />
        EN PANTALLA
      </span>
      <div
        key={index}
        className="absolute inset-0 flex animate-fade-in flex-col items-center justify-center gap-[3cqw] p-[9cqw] text-center"
      >
        <p className="font-serif text-[5.4cqw] leading-tight font-medium whitespace-pre-line text-white">
          {sample.text}
        </p>
        <p className="text-[2.6cqw] font-semibold tracking-[0.3cqw] text-white/60 uppercase">
          {sample.footnote}
        </p>
      </div>
    </div>
  );
}
