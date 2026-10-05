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
- `select` de responsable con el nuevo primitivo (incluye "Agregar persona…").

## Criterios de aceptación

- Con mocks: todo igual que antes más los ajustes de la iglesia.
- Un `operator` ve personas y servicios en solo lectura (pero puede agregar personas: tiene `people.manage`).
- Compila, lint, tipos, build.

## Desviaciones

_(Completar al cerrar la fase.)_
