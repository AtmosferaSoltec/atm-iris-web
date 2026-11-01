import { Surface } from "@/components/ui/surface";
import { SectionTitle } from "./section-title";

const STEPS = [
  {
    title: "Instálalo",
    text: "Descarga Iris, ábrelo y listo. No hay cuenta, ni claves, ni nada que configurar en un servidor.",
  },
  {
    title: "Prepara tu servicio",
    text: "Trae tus canciones, pon tus fondos y arma el orden del domingo. Todo queda en tu computadora.",
  },
  {
    title: "Proyecta y lleva el tiempo",
    text: "Conecta el televisor, elige la pantalla y dirige. Al terminar, Iris guarda cuánto duró cada parte.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-content scroll-mt-24 px-4 py-24 sm:px-8">
      <SectionTitle eyebrow="Cómo funciona" title="De tu casa al templo, en tres pasos" />
      <ol className="mt-14 grid gap-5 lg:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <Surface className="h-full overflow-hidden p-8">
              <span
                aria-hidden
                className="text-accent font-serif text-[88px] leading-none font-medium select-none"
              >
                {index + 1}
              </span>
              <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{step.text}</p>
            </Surface>
          </li>
        ))}
      </ol>
    </section>
  );
}
