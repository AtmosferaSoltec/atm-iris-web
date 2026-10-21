"use client";

import { Lock, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { deleteAccount } from "../actions";

/** Deleting the account: the church, its songs, media, services and this login. Behind a password and a typed word. */
export function DeleteAccountPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [word, setWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const canDelete = password.length > 0 && word === "ELIMINAR";

  function close() {
    setIsOpen(false);
    setPassword("");
    setWord("");
    setError(null);
  }

  function remove() {
    setError(null);
    startDelete(async () => {
      const result = await deleteAccount({ password });
      // On success the action redirects to sign-in: it never comes back here.
      if (result.error) setError(result.error);
    });
  }

  return (
    <div>
      <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={() => setIsOpen(true)}>
        Eliminar cuenta
      </Button>

      <Dialog
        open={isOpen}
        onClose={isDeleting ? () => {} : close}
        title="¿Eliminar tu cuenta?"
        description="Se borra todo lo de tu iglesia: canciones, multimedia, sonidos, servicios, registros de tiempos, televisores y tu cuenta. No se puede deshacer. Si vuelves a registrarte con este correo, empiezas desde cero."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={remove} isLoading={isDeleting} disabled={!canDelete}>
              Eliminar mi cuenta
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pb-2">
          {error && <Banner tone="error">{error}</Banner>}
          <TextField
            id="delete-password"
            type="password"
            label="Contraseña"
            autoComplete="current-password"
            icon={<Lock />}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <TextField
            id="delete-confirm"
            label="Escribe ELIMINAR para confirmar"
            autoComplete="off"
            value={word}
            onChange={(event) => setWord(event.target.value)}
          />
        </div>
      </Dialog>
    </div>
  );
}
