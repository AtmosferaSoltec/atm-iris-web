import { Plus } from "lucide-react";
import { SectionTitle } from "./section-title";

const QUESTIONS = [
  {
    q: "¿Necesito internet para usar Iris?",
    a: "No. Todo funciona sin conexión. Solo se usa internet para buscar versiones nuevas al abrir la aplicación y para reproducir un video de YouTube cuando pegas su enlace.",
  },
  {
    q: "¿Dónde se guardan mis canciones y archivos?",
    a: "En una carpeta «Iris» de tu computadora. Nada se sube a ningún servidor y no necesitas crear una cuenta.",
  },
  {
    q: "¿Por qué la actualización es obligatoria?",
    a: "Para que todos los equipos de tu iglesia usen la misma versión y no aparezcan diferencias a mitad de un servicio. Antes de actualizar, Iris guarda una copia de tus datos.",
  },
  {
    q: "¿Puedo traer las canciones que ya tengo?",
    a: "Sí. Puedes importar tus canciones desde un archivo JSON, por ejemplo uno exportado desde Holyrics, y asignarles sus audios por lotes.",
  },
  {
    q: "¿Los videos de YouTube se descargan?",
    a: "No. Se reproducen con el reproductor de YouTube, tal como están, y pueden mostrar sus anuncios. Iris no los guarda en tu computadora.",
  },
  {
    q: "¿Qué pantallas puedo usar?",
    a: "Cualquier monitor, proyector o televisor conectado a tu computadora. Eliges cuál es la pantalla de proyección y la consola queda en la principal.",
  },
];

export function Faq() {
  return (
    <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-24 sm:px-8">
      <SectionTitle eyebrow="Preguntas" title="Lo que suelen preguntar" />
      <div className="mt-12 flex flex-col gap-3">
        {QUESTIONS.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-lg bg-surface ring-1 ring-line transition open:bg-surface-raised"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-semibold [&::-webkit-details-marker]:hidden">
              {q}
              <Plus
                className="size-5 shrink-0 text-ink-2 transition group-open:rotate-45"
                aria-hidden
              />
            </summary>
            <p className="px-6 pb-6 leading-relaxed text-ink-2">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
