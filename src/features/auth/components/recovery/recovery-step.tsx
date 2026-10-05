import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const STEPS = 3;

type Props = { step: 1 | 2 | 3; icon: ReactNode; title: string; description: ReactNode };

/** Header shared by the 3 recovery screens: progress, emblem, title and copy. */
export function RecoveryStep({ step, icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="flex items-center gap-2" aria-label={`Paso ${step} de ${STEPS}`}>
        {Array.from({ length: STEPS }, (_, index) => (
          <span
            key={index}
            aria-hidden
            className={cn(
              "h-1.5 rounded-full transition-all",
              index + 1 === step
                ? "w-8 bg-accent"
                : index + 1 < step
                  ? "w-4 bg-coral/60"
                  : "w-4 bg-white/15",
            )}
          />
        ))}
      </div>
      <span className="grid size-16 place-items-center rounded-full bg-accent text-ink-inverse shadow-[0_10px_30px_-10px_rgb(255_122_89/0.6)] [&_svg]:size-7">
        {icon}
      </span>
      <div>
        <p className="eyebrow text-ink-3">
          Paso {step} de {STEPS}
        </p>
        <h1 className="mt-2 font-serif text-[28px] font-medium tracking-tight">{title}</h1>
        <p className="mt-2 text-[15px] text-ink-2">{description}</p>
      </div>
    </div>
  );
}
