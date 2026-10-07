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
import { toast } from "@/components/ui/toaster";
import type { Person } from "@/domain/models";
import { idleState, type FormState } from "@/lib/form-state";
import { nameKey, plural } from "@/lib/text";
import { addPerson, deletePerson, renamePerson } from "../actions";
import { PERSON_DUPLICATE } from "../schemas";

type Props = { people: Person[] };

function isTaken(people: Person[], name: string, exceptId?: string): boolean {
  const key = nameKey(name);
  return (
    Boolean(key) && people.some((person) => person.id !== exceptId && nameKey(person.name) === key)
  );
}

export function PeopleManager({ people }: Props) {
  const [renaming, setRenaming] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState<Person | null>(null);
  const [deleteError, setDeleteError] = useState<string>();
  const [isDeleting, startDelete] = useTransition();

  function confirmDelete() {
    if (!deleting) return;
    startDelete(async () => {
      const result = await deletePerson(deleting.id);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      toast.success(`Se eliminó a ${deleting.name}`);
      setDeleting(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <AddPersonForm people={people} />

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
              <span className="text-sm text-ink-2 tabular-nums">
                {plural(person.blockCount, "bloque")}
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
                  onClick={() => {
                    setDeleteError(undefined);
                    setDeleting(person);
                  }}
                  className="hover:text-danger"
                >
                  <Trash2 />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {renaming && (
        <RenameDialog person={renaming} people={people} onClose={() => setRenaming(null)} />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        isPending={isDeleting}
        error={deleteError}
        title={`¿Eliminar a ${deleting?.name ?? ""}?`}
        description="Sus tiempos guardados se conservan."
        confirmLabel="Eliminar"
      />
    </div>
  );
}

function AddPersonForm({ people }: { people: Person[] }) {
  const [state, action] = useActionState(
    async (previous: FormState<"name">, formData: FormData): Promise<FormState<"name">> => {
      const name = String(formData.get("name") ?? "");
      if (isTaken(people, name)) {
        return { status: "error", fieldErrors: { name: PERSON_DUPLICATE }, values: { name } };
      }
      const next = await addPerson(previous, formData);
      if (next.status === "success") toast.success(`Se agregó a ${name.trim()}`);
      return next;
    },
    idleState,
  );
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

function RenameDialog({
  person,
  people,
  onClose,
}: {
  person: Person;
  people: Person[];
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(person.name);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function save() {
    if (isTaken(people, draft, person.id)) {
      setError(PERSON_DUPLICATE);
      return;
    }
    startTransition(async () => {
      const result = await renamePerson(person.id, draft);
      if (result.error) setError(result.error);
      else {
        toast.success("Nombre actualizado");
        onClose();
      }
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
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
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        {error && <Banner tone="error">{error}</Banner>}
        <TextField
          id="rename"
          aria-label="Nombre"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(undefined);
          }}
          autoFocus
        />
      </form>
    </Dialog>
  );
}
