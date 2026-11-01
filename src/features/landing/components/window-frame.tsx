import { cn } from "@/lib/cn";

/** Una captura de la aplicación dentro de una ventana, para mostrarla sin que parezca un recorte. */
export function WindowFrame({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/12 bg-black shadow-[0_40px_80px_-20px_rgb(0_0_0/0.7),0_0_0_1px_rgb(255_255_255/0.04)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="flex h-9 items-center gap-2 border-b border-white/10 bg-elevated px-4"
      >
        <span className="size-3 rounded-full bg-white/15" />
        <span className="size-3 rounded-full bg-white/15" />
        <span className="size-3 rounded-full bg-white/15" />
      </div>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="block h-auto w-full"
      />
    </div>
  );
}
