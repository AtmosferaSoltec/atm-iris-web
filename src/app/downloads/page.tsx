import { Download, MonitorCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IrisWordmark } from "@/components/brand/iris-mark";
import { buttonStyles } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { getRepositories } from "@/server/repositories";

export const metadata: Metadata = {
  title: "Descargar Iris",
  description: "Instala la consola de Iris en el computador del templo.",
};

// The installer is a static file served by nginx next to this page (see docs/plans in atm-iris-win, fase 12).
const WINDOWS_INSTALLER = "/downloads/windows/Iris-Setup.exe";

const STEPS = [
  {
    title: "Descarga y abre el instalador",
    text: "Se instala solo, sin permisos de administrador. Al terminar, Iris se abre.",
  },
  {
    title: "Si Windows muestra «Windows protegió tu PC»",
    text: "Pulsa «Más información» y luego «Ejecutar de todas formas». Es normal en una aplicación nueva.",
  },
  {
    title: "Inicia sesión con la cuenta de tu iglesia",
    text: "Tus letras, música y multimedia aparecen en la consola. Iris se actualiza sola cuando hay una versión nueva.",
  },
];

export default async function DownloadsPage() {
  const version = await getRepositories().releases.latestVersion("windows");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[880px] flex-col justify-center gap-10 px-4 py-12 sm:px-8">
      <IrisWordmark height={30} />

      <section className="flex flex-col gap-5">
        <p className="w-fit text-accent eyebrow">Consola para Windows</p>
        <h1 className="max-w-xl font-serif text-5xl leading-[1.05] font-medium tracking-tight text-balance">
          Descarga <em className="text-accent pr-1">Iris</em> para el templo.
        </h1>
        <p className="max-w-lg text-lg text-ink-2">
          Dirige el servicio y proyecta letras, versículos y multimedia desde el computador
          conectado a la pantalla grande.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-2">
          <a href={WINDOWS_INSTALLER} download className={buttonStyles({ size: "lg" })}>
            <Download className="size-4" aria-hidden />
            Descargar para Windows
          </a>
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <MonitorCheck className="size-4" aria-hidden />
            {version ? `Versión ${version} · ` : ""}Windows 10 (1809) o superior, 64 bits
          </p>
        </div>
      </section>

      <Surface className="p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-medium">Instalar en tres pasos</h2>
        <ol className="mt-5 flex flex-col gap-5">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-sm font-semibold ring-1 ring-line ring-inset"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-[15px] text-ink-2">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Surface>

      <p className="text-sm text-ink-2">
        Las letras, la música y la multimedia se suben desde la web.{" "}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
          Inicia sesión o crea la cuenta de tu iglesia
        </Link>
        .
      </p>
    </main>
  );
}
