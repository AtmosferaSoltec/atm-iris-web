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
