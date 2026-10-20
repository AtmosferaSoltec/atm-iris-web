"use client";

import { Tv, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Banner } from "@/components/ui/banner";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import type { Display } from "@/domain/models";
import { cn } from "@/lib/cn";
import { claimDisplay, removeDisplay } from "../actions";
import type { LiveConsole } from "../use-live-console";

/**
 * "Televisores" (contract §18): the church's linked TVs, and linking a new one with the
 * code it shows at `/display`, like Netflix.
 */
export function DisplaysDialog({ ctrl, onClose }: { ctrl: LiveConsole; onClose: () => void }) {
  const { displays, added, removed, refresh } = ctrl.remote;
  const [code, setCode] = useState("");
  const [name, setName] = useState(displays.length === 0 ? "TV del salón" : "");
  const [errors, setErrors] = useState<{ code?: string; name?: string; form?: string }>({});
  const [isLinking, startLink] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);
  const address = typeof window === "undefined" ? "" : `${window.location.host}/display`;

  // Who is on right now, not ten seconds ago.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  function link() {
    setErrors({});
    startLink(async () => {
      const result = await claimDisplay(code, name);
      if (result.display) {
        added(result.display);
        toast.success(`«${result.display.name}» conectado`);
        setCode("");
        setName("");
      } else {
        setErrors({ ...result.fieldErrors, form: result.error });
      }
    });
  }

  async function unlink(display: Display) {
    setRemoving(display.id);
    const result = await removeDisplay(display.id);
    setRemoving(null);
    if (result.error) toast.error(result.error);
    else {
      removed(display.id);
      toast.success(`«${display.name}» desconectado`);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Televisores"
      description="Un televisor con internet muestra lo que proyectas, sin cables. Se conecta una sola vez."
      size="md"
    >
      <div className="flex flex-col gap-6 pb-6">
        {displays.length > 0 && (
          <ul className="flex flex-col divide-y divide-line rounded-md ring-1 ring-line">
            {displays.map((display) => (
              <li key={display.id} className="flex items-center gap-3 px-4 py-3">
                <Tv
                  aria-hidden
                  className={cn("size-5 shrink-0", display.online ? "text-success" : "text-ink-2")}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{display.name}</span>
                  <span className="block text-xs text-ink-2">
                    {display.online ? "Conectado" : "Apagado o sin internet"}
                  </span>
                </span>
                <IconButton
                  label={`Desconectar ${display.name}`}
                  disabled={removing === display.id}
                  onClick={() => void unlink(display)}
                >
                  <X />
                </IconButton>
              </li>
            ))}
          </ul>
        )}

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            link();
          }}
        >
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-ink-2">
            <li>
              En el navegador del televisor abre <strong className="text-ink">{address}</strong>
            </li>
            <li>Escribe aquí el código que aparece en el televisor.</li>
          </ol>
          {errors.form && <Banner tone="error">{errors.form}</Banner>}
          <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
            <TextField
              id="display-code"
              label="Código"
              placeholder="ABC123"
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 6),
                )
              }
              error={errors.code}
              autoComplete="off"
              autoFocus
              className="font-mono text-lg tracking-[0.3em] uppercase"
            />
            <TextField
              id="display-name"
              label="Nombre"
              placeholder="TV del salón"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={errors.name}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            <Button type="submit" isLoading={isLinking} disabled={code.length !== 6}>
              Conectar televisor
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
