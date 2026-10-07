"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { PLANS, planForQuota, type Plan } from "@/domain/plans";
import { cn } from "@/lib/cn";
import { fileSize } from "@/lib/format";

const COMMON = [
  "Letras, Biblia y control de tiempos",
  "iPad y Windows sincronizados",
  "Una cuenta para toda la iglesia",
];

/** Free is the starting point; bigger plans only add media space. */
export function PlanPicker({ quotaBytes }: { quotaBytes: number }) {
  const current = planForQuota(quotaBytes);
  const [requested, setRequested] = useState<Plan | null>(null);

  return (
    <>
      <ul id="plan" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
        {PLANS.map((plan) => {
          const isCurrent = current?.code === plan.code;
          const isLower = quotaBytes > plan.quotaBytes;
          return (
            <li
              key={plan.code}
              className={cn(
                "flex flex-col gap-4 rounded-lg p-5 ring-1",
                isCurrent ? "bg-surface ring-2 ring-coral" : "ring-line",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif text-xl font-medium">{plan.name}</h3>
                {isCurrent && <Chip color="var(--color-coral)">Tu plan</Chip>}
              </div>
              <p className="text-sm text-ink-2">{plan.tagline}</p>
              <p className="text-3xl font-semibold tabular-nums">
                {fileSize(plan.quotaBytes)}
                <span className="ml-1.5 text-sm font-normal text-ink-2">de multimedia</span>
              </p>
              <ul className="flex flex-col gap-2 text-sm">
                {COMMON.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              {!isCurrent && !isLower && (
                <Button variant="secondary" className="mt-auto" onClick={() => setRequested(plan)}>
                  Quiero este plan
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {!current && (
        <p className="text-sm text-ink-2">
          Tu iglesia tiene {fileSize(quotaBytes)} de multimedia, un plan a la medida.
        </p>
      )}

      <Dialog
        open={requested !== null}
        onClose={() => setRequested(null)}
        title={requested ? `Plan ${requested.name}` : undefined}
        description="Los pagos en línea llegan pronto."
        size="sm"
        footer={<Button onClick={() => setRequested(null)}>Entendido</Button>}
      >
        <p className="pb-2 text-sm text-ink-2">
          Por ahora activamos los planes a mano. Cuando el pago esté disponible podrás cambiar de
          plan desde esta misma pantalla y el espacio extra se aplicará al instante.
        </p>
      </Dialog>
    </>
  );
}
