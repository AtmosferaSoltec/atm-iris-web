/** Resplandor de fondo de las páginas públicas: tres luces suaves detrás del contenido. */
export function PageGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] overflow-hidden"
    >
      <div className="absolute -top-40 left-[8%] size-[560px] rounded-full bg-violet/25 blur-[140px]" />
      <div className="absolute -top-24 right-[6%] size-[520px] rounded-full bg-rose/20 blur-[140px]" />
      <div className="absolute top-72 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-indigo/15 blur-[140px]" />
    </div>
  );
}
