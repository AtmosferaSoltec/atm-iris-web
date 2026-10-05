"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import { Switch } from "@/components/ui/switch";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import type { MediaAsset } from "@/domain/models";
import { idleState, type FormState } from "@/lib/form-state";
import { deleteMedia, setMediaBackground, updateMediaDetails } from "../actions";
import { fileFacts, KIND_LABELS } from "../media-format";
import type { MediaField } from "../schemas";

type Props = {
  asset: MediaAsset;
  /** Signed download URL; null when it couldn't be fetched. */
  url: string | null;
  canManage: boolean;
  onClose: () => void;
};

export function MediaDetailDialog({ asset, url, canManage, onClose }: Props) {
  const [isBackground, setIsBackground] = useState(asset.isBackground);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [state, action] = useActionState(
    async (previous: FormState<MediaField>, formData: FormData) => {
      const next = await updateMediaDetails(asset.id, previous, formData);
      if (next.status === "success") toast.success("Cambios guardados");
      return next;
    },
    idleState,
  );

  function toggleBackground(value: boolean) {
    setIsBackground(value);
    startTransition(async () => {
      const result = await setMediaBackground(asset.id, value);
      if (result.error) {
        setIsBackground(!value);
        toast.error(result.error);
      } else {
        toast.success(value ? "Ahora se ofrece como fondo" : "Ya no se ofrece como fondo");
      }
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteMedia(asset.id);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      toast.success(`Se eliminó «${asset.title}»`);
      setIsConfirmingDelete(false);
      onClose();
    });
  }

  return (
    <Dialog open onClose={onClose} size="lg" title={asset.title} description={fileFacts(asset)}>
      <div className="grid gap-6 pb-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Preview asset={asset} url={url} />

        <div className="flex flex-col gap-5">
          {canManage ? (
            <form action={action} className="flex flex-col gap-4" noValidate>
              {state.message && <Banner tone="error">{state.message}</Banner>}
              <TextField
                id="title"
                label="Título"
                defaultValue={state.values?.title ?? asset.title}
                error={state.fieldErrors?.title}
              />
              <TextArea
                id="description"
                label="Descripción"
                placeholder="Opcional"
                defaultValue={state.values?.description ?? asset.description ?? ""}
                error={state.fieldErrors?.description}
                className="min-h-24"
              />
              <div>
                <SubmitButton variant="secondary">Guardar</SubmitButton>
              </div>
            </form>
          ) : (
            asset.description && <p className="text-sm text-ink-2">{asset.description}</p>
          )}

          {asset.kind === "image" && (
            <label className="flex items-center justify-between gap-4 rounded-md bg-surface p-4 ring-1 ring-line ring-inset">
              <span>
                <span className="block text-sm font-semibold">Usar como fondo en la consola</span>
                <span className="block text-xs text-ink-2">
                  Aparece en el selector de fondos del iPad y de Windows.
                </span>
              </span>
              <Switch
                label="Usar como fondo en la consola"
                checked={isBackground}
                onCheckedChange={toggleBackground}
                disabled={!canManage || isPending}
              />
            </label>
          )}

          {canManage && (
            <div className="mt-auto border-t border-line pt-4">
              <Button
                variant="ghost"
                className="text-danger hover:text-danger"
                icon={<Trash2 className="size-4" />}
                onClick={() => {
                  setDeleteError(undefined);
                  setIsConfirmingDelete(true);
                }}
              >
                Eliminar
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={confirmDelete}
        isPending={isPending}
        error={deleteError}
        title={`¿Eliminar «${asset.title}»?`}
        description="Se quitará de la biblioteca y de las consolas."
        confirmLabel="Eliminar"
      />
    </Dialog>
  );
}

function Preview({ asset, url }: { asset: MediaAsset; url: string | null }) {
  if (!url) {
    return (
      <div className="grid aspect-video place-items-center rounded-md bg-surface text-sm text-ink-2 ring-1 ring-line">
        No pudimos cargar la vista previa.
      </div>
    );
  }
  if (asset.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed URLs expire in 1 h; next/image would cache them
      <img
        src={url}
        alt={asset.title}
        className="aspect-video w-full rounded-md bg-black object-contain ring-1 ring-line"
      />
    );
  }
  if (asset.kind === "video") {
    return (
      <video
        src={url}
        controls
        preload="metadata"
        aria-label={asset.title}
        className="aspect-video w-full rounded-md bg-black ring-1 ring-line"
      />
    );
  }
  return (
    <div className="flex flex-col justify-center gap-4 rounded-md bg-surface p-6 ring-1 ring-line">
      <p className="eyebrow text-ink-2">{KIND_LABELS.audio.singular}</p>
      <audio src={url} controls preload="metadata" aria-label={asset.title} className="w-full" />
    </div>
  );
}
