import type { StorageUsage } from "@/domain/models";
import { cn } from "@/lib/cn";
import { fileSize, percent } from "@/lib/format";

/** "3,2 GB de 5 GB" with a bar that turns amber from 80 % and red from 95 %. */
export function StorageUsage({
  usedBytes,
  quotaBytes,
  className,
}: {
  usedBytes: number;
  quotaBytes: number;
  className?: string;
}) {
  const ratio = quotaBytes > 0 ? Math.min(1, usedBytes / quotaBytes) : 0;
  const tone = ratio >= 0.95 ? "bg-danger" : ratio >= 0.8 ? "bg-warning" : "bg-success";
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span>
          <strong className="font-semibold">{fileSize(usedBytes)}</strong>
          <span className="text-ink-2"> de {fileSize(quotaBytes)}</span>
        </span>
        <span className="text-ink-2 tabular-nums">{percent(ratio)}</span>
      </div>
      <div
        role="meter"
        aria-label="Almacenamiento usado"
        aria-valuemin={0}
        aria-valuemax={quotaBytes}
        aria-valuenow={usedBytes}
        aria-valuetext={`${fileSize(usedBytes)} de ${fileSize(quotaBytes)}`}
        className="h-2 overflow-hidden rounded-full bg-surface-raised"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", tone)}
          style={{ width: `${Math.max(ratio * 100, usedBytes > 0 ? 1 : 0)}%` }}
        />
      </div>
    </div>
  );
}

const SECTIONS = [
  { key: "musicBytes", label: "Música", color: "var(--color-success)" },
  { key: "backgroundBytes", label: "Fondos", color: "var(--color-violet)" },
  { key: "mediaBytes", label: "Multimedia", color: "var(--color-rose)" },
] as const;

/** Ajustes: one bar split by section (they share the quota) and what each one takes. */
export function StorageBreakdown({ storage }: { storage: StorageUsage }) {
  const { usedBytes, quotaBytes, breakdown } = storage;
  const ratio = quotaBytes > 0 ? Math.min(1, usedBytes / quotaBytes) : 0;
  const freeBytes = Math.max(0, quotaBytes - usedBytes);
  const share = (bytes: number) => (quotaBytes > 0 ? (bytes / quotaBytes) * 100 : 0);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span>
          <strong className="font-semibold">{fileSize(usedBytes)}</strong>
          <span className="text-ink-2"> de {fileSize(quotaBytes)}</span>
        </span>
        <span
          className={cn(
            "tabular-nums",
            ratio >= 0.95 ? "text-danger" : ratio >= 0.8 ? "text-warning" : "text-ink-2",
          )}
        >
          Quedan {fileSize(freeBytes)}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Almacenamiento usado"
        aria-valuemin={0}
        aria-valuemax={quotaBytes}
        aria-valuenow={usedBytes}
        aria-valuetext={`${fileSize(usedBytes)} de ${fileSize(quotaBytes)}`}
        className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface-raised"
      >
        {SECTIONS.map(({ key, color }) =>
          breakdown[key] > 0 ? (
            <div
              key={key}
              className="h-full transition-[width] duration-500"
              style={{ width: `${Math.max(share(breakdown[key]), 1)}%`, backgroundColor: color }}
            />
          ) : null,
        )}
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {SECTIONS.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-2.5 rounded-md bg-surface px-3.5 py-3">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <dt className="flex-1 text-sm">{label}</dt>
            <dd className="text-sm font-semibold tabular-nums">{fileSize(breakdown[key])}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
