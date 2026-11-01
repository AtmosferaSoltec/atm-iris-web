import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-20 sm:px-8">
      <h1 className="font-serif text-4xl font-medium tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-ink-2">
        Borrador: el texto definitivo se publicará antes del lanzamiento.
      </p>
      <div className="mt-10 flex flex-col gap-4 leading-relaxed text-ink-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink">
        {children}
      </div>
    </article>
  );
}
