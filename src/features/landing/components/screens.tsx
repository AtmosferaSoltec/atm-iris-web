import { useState } from "react";
import { cn } from "@/lib/cn";
import consola from "@/assets/screens/consola.png";
import tiempos from "@/assets/screens/tiempos.png";
import { ProjectionShowcase } from "./projection-showcase";
import { SectionTitle } from "./section-title";
import { WindowFrame } from "./window-frame";

const SCREENS = [
  {
    id: "consola",
    label: "La consola",
    title: "Tú diriges desde una pantalla, el templo ve la otra",
    text: "La biblioteca a la izquierda, el servicio a la derecha y la letra al centro. Un clic envía la diapositiva a la pantalla grande y la vista en vivo te muestra lo que se está proyectando.",
  },
  {
    id: "tiempos",
    label: "Tiempos",
    title: "Sabrás cómo fue cada servicio",
    text: "Cada bloque guarda cuánto duró contra lo que estaba previsto. Filtra por servicio y por meses, corrige una hora que se te pasó y descarga el informe.",
  },
  {
    id: "pantalla",
    label: "La pantalla",
    title: "Letras grandes, claras y sin distracciones",
    text: "Elige la tipografía, el tamaño y un fondo para cada canción. Lo único que aparece en el televisor es lo que tú envías.",
  },
] as const;

export function Screens() {
  const [current, setCurrent] = useState<(typeof SCREENS)[number]["id"]>("consola");
  const screen = SCREENS.find((candidate) => candidate.id === current)!;

  return (
    <section id="pantallas" className="mx-auto max-w-content scroll-mt-24 px-4 py-24 sm:px-8">
      <SectionTitle eyebrow="Pantallas" title="Así se ve Iris por dentro" />
      <div
        role="tablist"
        aria-label="Pantallas de Iris"
        className="mx-auto mt-10 flex w-fit gap-1 rounded-full bg-surface p-1 ring-1 ring-line ring-inset"
      >
        {SCREENS.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={item.id === current}
            onClick={() => setCurrent(item.id)}
            className={cn(
              "cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition",
              item.id === current ? "bg-ink text-ink-inverse" : "text-ink-2 hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-6 max-w-2xl text-center">
        <h3 className="text-xl font-semibold">{screen.title}</h3>
        <p className="mt-2 text-ink-2">{screen.text}</p>
      </div>
      <div role="tabpanel" className="relative mx-auto mt-10 max-w-5xl">
        {current === "consola" && (
          <WindowFrame
            src={consola}
            alt="La consola de Iris con la biblioteca, el servicio y la vista en vivo"
            width={1440}
            height={900}
          />
        )}
        {current === "tiempos" && (
          <WindowFrame
            src={tiempos}
            alt="El registro de tiempos de Iris con la duración de cada bloque frente a lo previsto"
            width={1440}
            height={900}
          />
        )}
        {current === "pantalla" && (
          <div className="mx-auto max-w-4xl">
            <ProjectionShowcase />
          </div>
        )}
      </div>
    </section>
  );
}
