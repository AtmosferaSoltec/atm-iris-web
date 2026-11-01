import { Apple, Download, Monitor } from "lucide-react";
import { buttonStyles } from "@/components/ui/button-styles";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { detectPlatform, formatSize, type Platform } from "@/lib/platform";
import { fileUrl, type ReleaseFile } from "@/features/releases/release";
import { useLatestRelease } from "@/features/releases/use-latest-release";
import { SectionTitle } from "./section-title";

type Option = { label: string; detail: string; file: ReleaseFile };

function Card({
  platform,
  highlighted,
  title,
  requirement,
  options,
}: {
  platform: Platform;
  highlighted: boolean;
  title: string;
  requirement: string;
  options: Option[];
}) {
  const Icon = platform === "windows" ? Monitor : Apple;
  return (
    <Surface className={cn("flex flex-col gap-6 p-8", highlighted && "border-coral/50")}>
      <div className="flex items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-lg bg-surface-raised ring-1 ring-line ring-inset">
          <Icon className="size-6" aria-hidden />
        </span>
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-ink-2">{requirement}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {options.map((option, index) => (
          <a
            key={option.file.file}
            href={fileUrl(option.file)}
            download
            className={buttonStyles({
              variant: highlighted && index === 0 ? "primary" : "secondary",
              size: "lg",
              className: "justify-between",
            })}
          >
            <span className="flex items-center gap-2">
              <Download className="size-5" aria-hidden />
              {option.label}
            </span>
            <span className="text-sm font-normal opacity-80">
              {option.detail} · {formatSize(option.file.sizeBytes)}
            </span>
          </a>
        ))}
      </div>
    </Surface>
  );
}

export function DownloadSection() {
  const { data: release, isPending, isError } = useLatestRelease();
  const platform = detectPlatform();

  return (
    <section id="descargar" className="mx-auto max-w-content scroll-mt-24 px-4 py-24 sm:px-8">
      <SectionTitle
        eyebrow="Descargar"
        title="Instala Iris en tu computadora"
        text={release ? `Versión ${release.version}.` : "Para Windows y macOS."}
      />
      {isError && (
        <p className="mx-auto mt-10 max-w-xl rounded-lg bg-surface p-6 text-center text-ink-2 ring-1 ring-line ring-inset">
          Las descargas estarán disponibles muy pronto.
        </p>
      )}
      {isPending && <p className="mt-10 text-center text-ink-2">Buscando la última versión…</p>}
      {release && (
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Card
            platform="windows"
            highlighted={platform === "windows"}
            title="Windows"
            requirement="Windows 10 u 11, 64 bits"
            options={[{ label: "Descargar instalador", detail: ".exe", file: release.windows.x64 }]}
          />
          <Card
            platform="mac"
            highlighted={platform === "mac"}
            title="macOS"
            requirement="macOS 12 o superior"
            options={[
              { label: "Apple Silicon (M1 o más nuevo)", detail: ".dmg", file: release.mac.arm64 },
              { label: "Mac con Intel", detail: ".dmg", file: release.mac.x64 },
            ]}
          />
        </div>
      )}
      <p className="mt-6 text-center text-sm text-ink-2">
        ¿No sabes qué Mac tienes? Menú Apple → «Acerca de esta Mac»: si dice «Chip», elige Apple
        Silicon.
      </p>
    </section>
  );
}
