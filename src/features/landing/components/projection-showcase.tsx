import { cn } from "@/lib/cn";

/**
 * La pantalla del templo: un televisor con la letra proyectada sobre uno de los fondos de Iris.
 * Es una ilustración (no una captura) para poder verla nítida a cualquier tamaño.
 */
export function ProjectionShowcase({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/15 bg-black shadow-[0_30px_60px_-15px_rgb(0_0_0/0.8)]",
        className,
      )}
    >
      <div className="relative aspect-video bg-[radial-gradient(120%_90%_at_50%_0%,#3a1c7a_0%,#2a1658_35%,#3d1235_75%,#150a22_100%)]">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_100%,rgb(240_80_140/0.35),transparent)]"
        />
        <p className="absolute inset-0 grid place-items-center px-[8%] text-center text-[clamp(0.9rem,2.1vw,1.6rem)] leading-snug font-semibold text-white [text-shadow:0_2px_18px_rgb(0_0_0/0.45)]">
          <span>
            Tu luz nos guía en la mañana,
            <br />
            camina junto a mí.
          </span>
        </p>
      </div>
      <div aria-hidden className="flex h-3 justify-center bg-elevated">
        <span className="h-full w-1/5 bg-white/10" />
      </div>
    </div>
  );
}
