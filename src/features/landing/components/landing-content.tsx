import {
  ArrowRight,
  CloudUpload,
  Download,
  Film,
  Library,
  ListChecks,
  MonitorPlay,
  Music2,
  RefreshCw,
  Tablet,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ProjectionShowcase } from "@/features/auth/components/projection-showcase";
import { buttonStyles } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { IrisWordmark } from "@/components/brand/iris-mark";

type Feature = { icon: LucideIcon; title: string; text: string };

const FEATURES: Feature[] = [
  {
    icon: Library,
    title: "Letras siempre a mano",
    text: "Guarda tus canciones y encuéntralas por título o por cualquier línea de la letra, en un segundo.",
  },
  {
    icon: Music2,
    title: "Tu música, en la nube",
    text: "Sube las pistas una vez; se descargan solas al dispositivo cuando las agregas al servicio.",
  },
  {
    icon: Film,
    title: "Multimedia y fondos",
    text: "Imágenes y videos para la pantalla, y fondos para que cada letra se vea como tu iglesia quiere.",
  },
  {
    icon: ListChecks,
    title: "Servicios con bloques",
    text: "Define la estructura de cada servicio, quién dirige cada parte y adelanta lo que usarás el domingo.",
  },
  {
    icon: Timer,
    title: "Control de tiempo",
    text: "Un cronómetro por bloque y, al terminar, un registro para ver cómo fue el servicio y mejorar.",
  },
  {
    icon: RefreshCw,
    title: "Todo sincronizado",
    text: "Lo que preparas en la web aparece en el iPad y en Windows, y sigue funcionando sin conexión.",
  },
];

const STEPS = [
  {
    title: "Prepara en la web",
    text: "Sube letras, música y multimedia, y arma el próximo servicio desde cualquier navegador.",
  },
  {
    title: "Se sincroniza solo",
    text: "Tu contenido llega a la consola del templo sin pasar archivos por cable ni por memoria USB.",
  },
  {
    title: "Dirige y proyecta",
    text: "Desde el iPad o la PC, lanza cada letra a la pantalla grande mientras llevas el tiempo del servicio.",
  },
];

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      <p className="text-accent eyebrow">{eyebrow}</p>
      <h2 className="font-serif text-4xl leading-tight font-medium tracking-tight text-balance sm:text-5xl">
        {title}
      </h2>
      {text && <p className="text-lg text-ink-2">{text}</p>}
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative mx-auto grid max-w-content items-center gap-14 px-4 pt-16 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-28">
      <div className="flex animate-fade-in flex-col gap-7">
        <p className="w-fit rounded-full bg-surface text-accent px-3.5 py-1.5 eyebrow ring-1 ring-line ring-inset">
          Proyección para iglesias
        </p>
        <h1 className="font-serif text-5xl leading-[1.03] font-medium tracking-tight text-balance sm:text-6xl lg:text-[72px]">
          Que cada palabra <em className="text-accent pr-1">ilumine</em> el templo.
        </h1>
        <p className="max-w-xl text-lg text-ink-2 sm:text-xl">
          Iris reúne tus letras, tu música y tu multimedia en un solo lugar, y las proyecta en la
          pantalla del templo mientras diriges el servicio con calma.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link href="/login?modo=crear" className={buttonStyles({ size: "lg" })}>
            Crear la cuenta de mi iglesia
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link href="/login" className={buttonStyles({ variant: "secondary", size: "lg" })}>
            Ya tengo cuenta
          </Link>
        </div>
        <p className="text-sm text-ink-2">Se configura en menos de un minuto.</p>
      </div>

      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(155_92_255/0.28),rgb(240_80_140/0.12)_55%,transparent)] blur-2xl"
        />
        <ProjectionShowcase className="max-w-none" />
        <Surface className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-lg px-4 py-3 sm:-left-6">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent text-ink-inverse">
            <Timer className="size-4" aria-hidden />
          </span>
          <span className="text-sm leading-tight">
            <span className="block font-semibold">Alabanzas</span>
            <span className="text-ink-2">12:40 de 15:00</span>
          </span>
        </Surface>
      </div>
    </section>
  );
}

export function LandingFeatures() {
  return (
    <section id="que-es" className="mx-auto max-w-content scroll-mt-24 px-4 py-20 sm:px-8">
      <SectionTitle
        eyebrow="Qué es Iris"
        title="Todo lo que tu servicio necesita, en un solo lugar"
        text="Menos archivos sueltos y menos nervios antes de empezar. Más tiempo para lo que importa."
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title}>
            <Surface className="flex h-full flex-col gap-4 p-7 transition duration-200 ease-(--ease-calm) hover:-translate-y-0.5 hover:ring-1 hover:ring-line-strong">
              <span className="flex size-11 items-center justify-center rounded-md bg-surface-raised text-coral ring-1 ring-line ring-inset">
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

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-content scroll-mt-24 px-4 py-20 sm:px-8">
      <SectionTitle eyebrow="Cómo funciona" title="De tu casa al templo, en tres pasos" />
      <ol className="mt-14 grid gap-5 lg:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <Surface className="relative h-full overflow-hidden p-8">
              <span
                aria-hidden
                className="text-accent font-serif text-[88px] leading-none font-medium opacity-90 select-none"
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

export function LandingApps() {
  return (
    <section id="apps" className="mx-auto max-w-content scroll-mt-24 px-4 py-20 sm:px-8">
      <SectionTitle
        eyebrow="Apps"
        title="Dirige desde el iPad o desde Windows"
        text="La web es para preparar. Las apps son la consola del servicio: conectadas al TV y listas aunque se caiga el internet."
      />
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <Surface className="flex flex-col gap-5 p-8">
          <span className="flex size-12 items-center justify-center rounded-md bg-surface-raised text-violet ring-1 ring-line ring-inset">
            <Tablet className="size-6" aria-hidden />
          </span>
          <div>
            <h3 className="text-xl font-semibold">iPad</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              Una consola táctil en tus manos: elige la letra, envíala a la pantalla y lleva el
              tiempo de cada bloque.
            </p>
          </div>
        </Surface>
        <Surface className="flex flex-col gap-5 p-8">
          <span className="flex size-12 items-center justify-center rounded-md bg-surface-raised text-indigo ring-1 ring-line ring-inset">
            <MonitorPlay className="size-6" aria-hidden />
          </span>
          <div>
            <h3 className="text-xl font-semibold">Windows</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              Instálala en el computador del templo, conéctala al segundo monitor y proyecta. Se
              actualiza sola.
            </p>
          </div>
          <Link
            href="/downloads"
            className={buttonStyles({ variant: "secondary", className: "mt-auto w-fit" })}
          >
            <Download className="size-4" aria-hidden />
            Descargar para Windows
          </Link>
        </Surface>
      </div>
    </section>
  );
}

export function LandingCta() {
  return (
    <section className="mx-auto max-w-content px-4 py-20 sm:px-8">
      <Surface className="relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl px-6 py-16 text-center sm:px-16">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,rgb(155_92_255/0.22),transparent),radial-gradient(50%_70%_at_100%_100%,rgb(240_80_140/0.16),transparent)]"
        />
        <CloudUpload className="size-8 text-coral" aria-hidden />
        <h2 className="max-w-2xl font-serif text-4xl leading-tight font-medium tracking-tight text-balance sm:text-5xl">
          Prepara tu próximo servicio hoy
        </h2>
        <p className="max-w-lg text-lg text-ink-2">
          Crea la cuenta de tu iglesia, sube tus primeras letras y pruébalo el domingo.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login?modo=crear" className={buttonStyles({ size: "lg" })}>
            Crear cuenta
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link href="/login" className={buttonStyles({ variant: "ghost", size: "lg" })}>
            Iniciar sesión
          </Link>
        </div>
      </Surface>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-8">
        <IrisWordmark height={22} />
        <p className="text-sm text-ink-2">Proyección para iglesias</p>
        <nav aria-label="Pie" className="flex gap-5 text-sm text-ink-2">
          <Link href="/login" className="hover:text-ink">
            Iniciar sesión
          </Link>
          <Link href="/downloads" className="hover:text-ink">
            Descargar
          </Link>
        </nav>
      </div>
    </footer>
  );
}
