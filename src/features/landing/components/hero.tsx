import { Download, Timer } from "lucide-react";
import { Link } from "react-router";
import { buttonStyles } from "@/components/ui/button-styles";
import { Surface } from "@/components/ui/surface";
import consola from "@/assets/screens/consola.png";
import { ProjectionShowcase } from "./projection-showcase";
import { WindowFrame } from "./window-frame";

export function Hero() {
  return (
    <section className="mx-auto max-w-content px-4 pt-14 pb-10 sm:px-8 lg:pt-24">
      <div className="mx-auto flex max-w-3xl animate-fade-in flex-col items-center gap-7 text-center">
        <p className="rounded-full bg-surface px-4 py-1.5 eyebrow text-ink-2 ring-1 ring-line ring-inset">
          Proyección y tiempos para iglesias
        </p>
        <h1 className="font-serif text-5xl leading-[1.03] font-medium tracking-tight text-balance sm:text-6xl lg:text-[76px]">
          Que cada palabra <em className="text-accent pr-1">ilumine</em> el templo.
        </h1>
        <p className="max-w-2xl text-lg text-ink-2 sm:text-xl">
          Iris proyecta las letras, la Biblia, los videos y los fondos en la pantalla de tu iglesia,
          y lleva el tiempo de cada parte del servicio. Funciona en tu computadora, sin internet y
          sin cuenta.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link to="/#descargar" className={buttonStyles({ size: "lg" })}>
            <Download className="size-5" aria-hidden />
            Descargar Iris
          </Link>
          <Link to="/#pantallas" className={buttonStyles({ variant: "secondary", size: "lg" })}>
            Ver cómo se ve
          </Link>
        </div>
        <p className="text-sm text-ink-2">Para Windows y macOS</p>
      </div>

      <div className="relative mx-auto mt-16 max-w-5xl animate-fade-in [animation-delay:150ms]">
        <div
          aria-hidden
          className="absolute -inset-x-10 -inset-y-8 -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(155_92_255/0.3),rgb(240_80_140/0.12)_60%,transparent)] blur-2xl"
        />
        <WindowFrame
          src={consola}
          alt="La consola de Iris: la biblioteca de canciones, el servicio, los bloques de tiempo y la vista en vivo"
          width={1440}
          height={900}
          priority
        />
        <ProjectionShowcase className="absolute -right-3 -bottom-10 hidden w-[36%] animate-float sm:block lg:-right-10" />
        <Surface className="absolute -bottom-6 left-3 hidden items-center gap-3 rounded-lg px-4 py-3 sm:flex lg:-left-8">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent text-ink-inverse">
            <Timer className="size-4" aria-hidden />
          </span>
          <span className="text-sm leading-tight">
            <span className="block font-semibold">Alabanza</span>
            <span className="text-ink-2">12:40 de 20:00</span>
          </span>
        </Surface>
      </div>
    </section>
  );
}
