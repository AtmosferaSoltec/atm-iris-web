import {
  BookOpen,
  FileText,
  Film,
  ListChecks,
  MonitorPlay,
  Music2,
  RefreshCw,
  ShieldCheck,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { SectionTitle } from "./section-title";

type Feature = { icon: LucideIcon; title: string; text: string; tint: string };

const FEATURES: Feature[] = [
  {
    icon: MonitorPlay,
    title: "Proyecta en la pantalla del templo",
    text: "Elige el monitor, el proyector o el televisor por HDMI y envía cada letra, imagen o video con un clic.",
    tint: "text-coral",
  },
  {
    icon: Music2,
    title: "Letras y pistas",
    text: "Guarda tus canciones, búscalas por título o por cualquier línea y asígnales su audio MP3, incluso por lotes.",
    tint: "text-ember",
  },
  {
    icon: BookOpen,
    title: "Biblia",
    text: "Importa tus traducciones y proyecta un pasaje escribiendo «Salmos 96» o «Juan 3:16».",
    tint: "text-violet",
  },
  {
    icon: Film,
    title: "Multimedia, fondos y YouTube",
    text: "Imágenes y videos de tu carpeta, fondos para cada canción y videos de YouTube pegando su enlace.",
    tint: "text-rose",
  },
  {
    icon: ListChecks,
    title: "El servicio en orden",
    text: "Arma el orden del servicio arrastrando canciones y archivos, y cámbialo en vivo si algo se mueve.",
    tint: "text-indigo",
  },
  {
    icon: Timer,
    title: "Tiempos por bloque",
    text: "Un cronómetro para cada parte, con quién la dirige, y un aviso cuando se acerca el límite.",
    tint: "text-coral",
  },
  {
    icon: FileText,
    title: "Informes de tiempos",
    text: "Revisa cómo fue cada servicio y descarga un informe en PDF o una tabla que abre en Excel.",
    tint: "text-ember",
  },
  {
    icon: ShieldCheck,
    title: "Tuyo y sin internet",
    text: "Tus canciones y archivos viven en tu computadora. No hay cuenta que crear ni nada que se suba.",
    tint: "text-success",
  },
  {
    icon: RefreshCw,
    title: "Siempre al día",
    text: "Iris busca versiones nuevas al abrirse y guarda una copia de tus datos antes de actualizar.",
    tint: "text-violet",
  },
];

export function Features() {
  return (
    <section id="funciones" className="mx-auto max-w-content scroll-mt-24 px-4 py-28 sm:px-8">
      <SectionTitle
        eyebrow="Funciones"
        title="Todo lo que tu servicio necesita, en un solo lugar"
        text="Menos archivos sueltos y menos nervios antes de empezar. Más tiempo para lo que importa."
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text, tint }) => (
          <li key={title}>
            <Surface className="flex h-full flex-col gap-4 p-7 transition duration-200 ease-(--ease-calm) hover:-translate-y-0.5 hover:border-white/20">
              <span
                className={`flex size-11 items-center justify-center rounded-md bg-surface-raised ring-1 ring-line ring-inset ${tint}`}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-[15px] leading-relaxed text-ink-2">{text}</p>
            </Surface>
          </li>
        ))}
      </ul>
    </section>
  );
}
