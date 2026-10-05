"use client";

import { Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import type { Person } from "@/domain/models";
import { idleState } from "@/lib/form-state";
import { plural } from "@/lib/text";
import { addPerson, deletePerson, renamePerson } from "../actions";

type Props = { people: Person[]; blockCounts: Record<string, number> };

export function PeopleManager({ people, blockCounts }: Props) {
  const [renaming, setRenaming] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState<Person | null>(null);
  const [error, setError] = useState<string>();
  const [isDeleting, startDelete] = useTransition();

  function confirmDelete() {
    if (!deleting) return;
    startDelete(async () => {
      const result = await deletePerson(deleting.id);
      setError(result.error);
      setDeleting(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <AddPersonForm />
      {error && <Banner tone="error">{error}</Banner>}

      {people.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Aún no hay personas"
          description="Agrega a quienes dirigen la bienvenida, las alabanzas o la prédica."
          className="py-8"
        />
      ) : (
        <ul className="divide-y divide-line">
          {people.map((person, index) => (
            <li key={person.id} className="group flex items-center gap-4 py-3">
              <Avatar name={person.name} index={index} />
              <p className="min-w-0 flex-1 truncate font-semibold">{person.name}</p>
              <span className="text-sm text-ink-3 tabular-nums">
                {plural(blockCounts[person.id] ?? 0, "bloque")}
              </span>
              <div className="flex gap-2 transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
                <IconButton
                  label={`Renombrar a ${person.name}`}
                  onClick={() => setRenaming(person)}
                >
                  <Pencil />
                </IconButton>
                <IconButton
                  label={`Eliminar a ${person.name}`}
                  onClick={() => setDeleting(person)}
                  className="hover:text-danger"
                >
                  <Trash2 />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <RenameDialog person={renaming} onClose={() => setRenaming(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        isPending={isDeleting}
        title={`¿Eliminar a ${deleting?.name ?? ""}?`}
        description="Sus tiempos guardados se conservan."
        confirmLabel="Eliminar"
      />
    </div>
  );
}

function AddPersonForm() {
  const [state, action] = useActionState(addPerson, idleState);
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      {state.message && <Banner tone="error">{state.message}</Banner>}
      <div className="flex items-start gap-3">
        <TextField
          // React resets the form after a successful add; errors bring the typed name back.
          id="name"
          aria-label="Nueva persona"
          placeholder="Nombre y apellido"
          icon={<UserPlus />}
          defaultValue={state.values?.name}
          error={state.fieldErrors?.name}
          containerClassName="flex-1"
          autoComplete="off"
        />
        <SubmitButton variant="secondary" size="lg">
          Agregar
        </SubmitButton>
      </div>
    </form>
  );
}

function RenameDialog({ person, onClose }: { person: Person | null; onClose: () => void }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [lastPersonId, setLastPersonId] = useState<string | null>(null);

  // Reset the draft whenever a different person is opened.
  if (person && person.id !== lastPersonId) {
    setLastPersonId(person.id);
    setDraft(person.name);
    setError(undefined);
  }

  function save() {
    if (!person) return;
    startTransition(async () => {
      const result = await renamePerson(person.id, draft);
      if (result.error) setError(result.error);
      else {
        setLastPersonId(null);
        onClose();
      }
    });
  }

  return (
    <Dialog
      open={person !== null}
      onClose={() => {
        setLastPersonId(null);
        onClose();
      }}
      title="Renombrar"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} isLoading={isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <TextField
          id="rename"
          aria-label="Nombre"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          error={error}
          autoFocus
        />
      </form>
    </Dialog>
  );
}
