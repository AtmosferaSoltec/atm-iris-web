"use client";

import { useRef, useState } from "react";
import { toast } from "@/components/ui/toaster";
import { MEDIA_ERRORS, MEDIA_RULES, mediaKindOf, tooLargeMessage } from "@/domain/media-rules";
import type { MediaKind, UploadTicket } from "@/domain/models";
import { titleFromFileName } from "@/lib/lyrics";
import { confirmUpload, requestUpload } from "../actions";
import { measureMedia } from "./measure";

export type UploadStatus =
  "measuring" | "requesting" | "uploading" | "confirming" | "done" | "error";

export type UploadItem = {
  id: string;
  fileName: string;
  title: string;
  kind: MediaKind | null;
  sizeBytes: number;
  status: UploadStatus;
  /** 0–1 while uploading. */
  progress: number;
  error?: string;
  /** Network failures can be retried; rejected files can't. */
  canRetry?: boolean;
};

export const NETWORK_UPLOAD_ERROR = "No se pudo subir.";

class UploadCancelled extends Error {}

/**
 * Upload queue: each file goes measure → ticket → PUT straight to the storage
 * (with progress, cancellable) → confirm. One file failing doesn't stop the rest.
 */
export function useMediaUpload() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const files = useRef(new Map<string, File>());
  const requests = useRef(new Map<string, XMLHttpRequest>());

  function patch(id: string, change: Partial<UploadItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...change } : item)));
  }

  async function run(id: string, file: File) {
    const kind = mediaKindOf(file.type);
    const title = titleFromFileName(file.name) || file.name;
    const fail = (error: string, canRetry = false) =>
      patch(id, { status: "error", error, canRetry, progress: 0 });

    // Same answer the API would give, without a round trip.
    if (!kind) return fail(MEDIA_ERRORS.UNSUPPORTED_MEDIA_TYPE);
    if (file.size > MEDIA_RULES[kind].maxBytes) return fail(tooLargeMessage(kind));

    patch(id, { status: "measuring", error: undefined, canRetry: false, progress: 0 });
    const measures = await measureMedia(file, kind);

    patch(id, { status: "requesting" });
    const requested = await requestUpload({
      kind,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    }).catch(() => ({ error: NETWORK_UPLOAD_ERROR, ticket: undefined }));
    if (!requested.ticket) return fail(requested.error ?? NETWORK_UPLOAD_ERROR, true);

    patch(id, { status: "uploading" });
    try {
      await put(id, file, requested.ticket);
    } catch (error) {
      if (error instanceof UploadCancelled) return;
      return fail(NETWORK_UPLOAD_ERROR, true);
    }

    patch(id, { status: "confirming", progress: 1 });
    const confirmed = await confirmUpload({
      uploadId: requested.ticket.uploadId,
      title,
      ...measures,
      isBackground: false,
    }).catch(() => ({ error: NETWORK_UPLOAD_ERROR, asset: undefined }));
    if (!confirmed.asset) return fail(confirmed.error ?? NETWORK_UPLOAD_ERROR, true);

    patch(id, { status: "done" });
    toast.success(`Se subió «${confirmed.asset.title}»`);
  }

  function put(id: string, file: File, ticket: UploadTicket): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      requests.current.set(id, request);
      request.open("PUT", ticket.uploadUrl);
      for (const [name, value] of Object.entries(ticket.headers)) {
        request.setRequestHeader(name, value);
      }
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) patch(id, { progress: event.loaded / event.total });
      };
      request.onload = () => {
        requests.current.delete(id);
        if (request.status >= 200 && request.status < 300) resolve();
        else reject(new Error(`PUT ${request.status}`));
      };
      request.onerror = () => {
        requests.current.delete(id);
        reject(new Error("network"));
      };
      request.onabort = () => {
        requests.current.delete(id);
        reject(new UploadCancelled());
      };
      request.send(file);
    });
  }

  function addFiles(list: FileList | File[]) {
    const added = Array.from(list).map((file) => {
      const id = crypto.randomUUID();
      files.current.set(id, file);
      const item: UploadItem = {
        id,
        fileName: file.name,
        title: titleFromFileName(file.name) || file.name,
        kind: mediaKindOf(file.type),
        sizeBytes: file.size,
        status: "measuring",
        progress: 0,
      };
      return item;
    });
    setItems((current) => [...current, ...added]);
    for (const item of added) void run(item.id, files.current.get(item.id)!);
  }

  function cancel(id: string) {
    requests.current.get(id)?.abort();
    dismiss(id);
  }

  function retry(id: string) {
    const file = files.current.get(id);
    if (file) void run(id, file);
  }

  function dismiss(id: string) {
    files.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function clearFinished() {
    setItems((current) => {
      const finished = current.filter((item) => item.status === "done" || item.status === "error");
      for (const item of finished) files.current.delete(item.id);
      return current.filter((item) => !finished.includes(item));
    });
  }

  const isBusy = items.some((item) => item.status !== "done" && item.status !== "error");

  return { items, isBusy, addFiles, cancel, retry, dismiss, clearFinished };
}
