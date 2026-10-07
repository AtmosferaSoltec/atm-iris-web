# 03 · Iglesia: ajustes, módulos, personas y servicios

## Objetivo

Pasar las pantallas existentes (Módulos, Personas, Servicios) al contrato §6, §8 y §9, con permisos, y
agregar los ajustes de la iglesia (nombre y zona horaria).

## Dependencias

Fases 00 y 02.

## Repositorios

- `ChurchRepository` (reemplaza a `ModuleSettingsRepository`): `get()`, `update({ name?, timezone? })`, `setModules(modules)`.
- `PeopleRepository`: `list()` (con `blockCount` del API; elimina el cálculo en la página con `blockCountsByPerson`
  si ya no se usa en otro lado), `create(name)`, `rename(id, name)`, `delete(id)`.
- `ServiceTypeRepository`: `list()`, `get(id)`, `create(input)`, `update(id, input)` (PUT), `delete(id)`.
- Implementaciones `api/` y `mock/`. Los errores `PERSON_NAME_TAKEN` y `SERVICE_TYPE_NAME_TAKEN` llegan al campo
  correspondiente con `toFormState`.

## Pantallas

### `/ajustes` — Ajustes de la iglesia

Reemplaza `/modulos` (deja `/modulos` redirigiendo a `/ajustes`):

1. Panel **Iglesia**: nombre y zona horaria (`select` con búsqueda de zonas IANA, agrupadas por región, mostrando la hora
   actual de cada una; por defecto `America/Lima`). Permiso `church.manage`; sin él, solo lectura.
2. Panel **Módulos**: el actual (guardado inmediato, encadenado, revierte si falla). Permiso `modules.manage`; sin él,
   interruptores deshabilitados con tooltip "Solo administradores".
3. Panel **Almacenamiento**: barra `usedBytes / quotaBytes` (se completa en la fase 05; aquí ya pinta con los datos de `/church`).

### Personas y Servicios

- Mismas pantallas, ahora contra el repositorio nuevo; la lógica de duplicados la decide el API (el cliente valida antes
  con `nameKey` de `src/lib/text.ts`, que debe ser **idéntico** a la regla del contrato §2: colapsa espacios internos).
- Permisos: sin `people.manage` / `serviceTypes.manage` se ocultan "Agregar", editar, borrar; las páginas siguen visibles.
- Editor de servicio: con el módulo de tiempo apagado, **reenvía los bloques existentes intactos** al guardar (contrato §9).
- Las plantillas no piden responsable: el responsable rota cada semana y se registra en cada servicio (fase 06).

## Criterios de aceptación

- Con mocks: todo igual que antes más los ajustes de la iglesia.
- Un `operator` ve personas y servicios en solo lectura (pero puede agregar personas: tiene `people.manage`).
- Compila, lint, tipos, build.

## Desviaciones

- **Sin `serviceTypes.manage`** las tarjetas de Servicios no son enlaces y `/servicios/nuevo` y `/servicios/[id]`
  responden "no encontrado" (`requirePermission`), coherente con el 404 del API. Con `loading.tsx` la respuesta ya
  salió con 200 cuando se decide; se ve `src/app/(app)/not-found.tsx`, dentro del layout.
- **Bloques al guardar**: solo los que ya existían en el tipo llevan `id`; los nuevos van sin `id` para que el API
  los cree (contrato §9). Con el módulo de tiempo apagado se reenvían los bloques guardados tal cual.
- **Interruptores de módulos**: guardan sin toast (el interruptor ya muestra el cambio, como en el iPad); los demás
  guardados de la fase muestran toast.
- **Zona horaria**: `Combobox` propio (`src/components/ui/combobox.tsx`, popover de Radix + listbox ARIA) con las
  zonas de `Intl.supportedValuesOf("timeZone")` agrupadas por región y la hora actual de cada una. Al guardar nombre
  o zona se reescribe la cookie de sesión, que los lleva.
- **`Select`**: pinta él mismo la etiqueta seleccionada e ignora el `""` que emite el `<select>` oculto de Radix
  cuando la opción se acaba de agregar ("Agregar persona…" en el editor de servicios).
- `ModuleSettingsRepository` y `blockCountsByPerson` se eliminaron (`blockCount` viene del API; el mock lo calcula).

- **Módulos del sistema (2026-10-07)**: `Church.availableModules` (contrato §6). En Ajustes › Módulos no se ofrece lo que
  está apagado para todo Iris (hoy la Biblia); el mock replica la misma regla (`MOCK_AVAILABLE_MODULES`). Si el API no
  manda el campo, todo se considera disponible.
