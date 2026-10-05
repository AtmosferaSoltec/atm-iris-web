"use client";

import { Building2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Banner } from "@/components/ui/banner";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import type { Church } from "@/domain/models";
import { timeOfDay } from "@/lib/format";
import { idleState, type FormState } from "@/lib/form-state";
import { listTimeZones } from "@/lib/time-zones";
import { zonedParts } from "@/lib/zoned-time";
import { updateChurch } from "../actions";
import type { ChurchField } from "../schemas";

function nowIn(timeZone: string): string {
  const { hour, minute } = zonedParts(new Date(), timeZone);
  return timeOfDay(hour, minute);
}

const TIME_ZONE_OPTIONS: ComboboxOption[] = listTimeZones().map((zone) => ({
  value: zone.id,
  label: zone.city,
  group: zone.region,
  keywords: zone.id,
  hint: () => nowIn(zone.id),
}));

export function ChurchForm({ church, canManage }: { church: Church; canManage: boolean }) {
  const [timezone, setTimezone] = useState(church.timezone);
  const [state, action] = useActionState(
    async (previous: FormState<ChurchField>, formData: FormData) => {
      const next = await updateChurch(previous, formData);
      if (next.status === "success") toast.success("Cambios guardados");
      return next;
    },
    idleState,
  );

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.message && <Banner tone="error">{state.message}</Banner>}
      <TextField
        id="name"
        label="Nombre"
        icon={<Building2 />}
        defaultValue={state.values?.name ?? church.name}
        error={state.fieldErrors?.name}
        readOnly={!canManage}
      />
      <Combobox
        id="timezone"
        name="timezone"
        label="Zona horaria"
        hint="Se usa para el saludo, los horarios de los servicios y los resúmenes de tiempos."
        options={TIME_ZONE_OPTIONS}
        value={timezone}
        onValueChange={setTimezone}
        searchPlaceholder="Buscar ciudad o región"
        emptyText="No encontramos esa zona"
        error={state.fieldErrors?.timezone}
        disabled={!canManage}
      />
      {canManage && (
        <div>
          <SubmitButton>Guardar</SubmitButton>
        </div>
      )}
    </form>
  );
}
