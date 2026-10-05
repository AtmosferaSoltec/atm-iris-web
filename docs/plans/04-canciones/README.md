# 04 · Canciones

## Objetivo

Contrato §10: la biblioteca pasa a buscar y paginar en el servidor, el editor agrega `copyright`, y la
importación usa `POST /songs/import`.

## Dependencias

Fases 00 y 03.

## Repositorio

`SongRepository`: `list({ search, page, limit, sort })` → `Paginated<SongSummary>`, `get(id)`, `create(input)`,
`update(id, input)` (PUT), `delete(id)`, `import(inputs)` → `{ created, skipped }`.
El mock implementa búsqueda sin acentos (con `nameKey`) y paginación igual que el API.

## Pantallas

### `/canciones`

- `search`, `page` y `sort` en la URL con `nuqs` (`shallow: false` para que el servidor vuelva a cargar).
  Campo de búsqueda con espera de 300 ms antes de actualizar la URL. Mantén el foco al recargar.
- Lista con `SongSummary` (ya no hay secciones en la lista). Paginación al pie: "1–20 de 134" + anterior/siguiente.
- Orden: "Título" o "Recientes" (`sort=-updatedAt`).
- Sin `songs.manage`: sin "Nueva canción" ni "Importar .txt"; la fila abre el editor en **solo lectura** (vista previa).

### Editor (`/canciones/nueva`, `/canciones/[id]`)

- Campo opcional "Derechos de autor" (`copyright`, ≤ 200) debajo de Autor, con pista "Ej. Dominio público".
- Guardar usa `create` / `update`; el resto igual (parser `src/lib/lyrics.ts`, vista previa).
- Solo lectura sin permiso: campos deshabilitados, sin Guardar ni Eliminar, vista previa visible.

### Importar `.txt`

- Igual que hoy, pero la confirmación llama a `import` y muestra el resultado del servidor: "Se importaron N canciones"
  y, si hubo `skipped`, la lista "Ya estaban en tu biblioteca: …".
- La detección local de duplicados se queda (avisa antes), pero manda la decisión al servidor.

## Criterios de aceptación

- Con mocks: búsqueda, paginación y orden funcionan y quedan en la URL (recargar conserva el estado).
- Compila, lint, tipos, build.

## Desviaciones

- **Orden**: `SegmentedControl` "Título | Recientes" en la URL (`sort`). Con búsqueda el API ordena por relevancia y
  el control no cambia el resultado; se deja visible para no mover la barra al escribir.
- **Duplicados antes de importar**: el diálogo pide todos los títulos con `listSongTitles` (páginas de 100) al
  abrirse y marca "Ya está en tu biblioteca" / "Repetida en esta importación" al pintar, así funciona aunque los
  títulos lleguen después de soltar los archivos. La decisión final es del servidor (`skipped`).
- **Sin `songs.manage`**: `/canciones/nueva` responde "no encontrado"; `/canciones/[id]` abre el editor en solo
  lectura (campos `readOnly`, sin Guardar, Eliminar ni "Cargar desde .txt").
- Atajo `/` para enfocar la búsqueda (`src/lib/use-slash-focus.ts`), adelantado de la fase 07.
- Errores `sections.N.*` del API se muestran en el campo "Letra" (alias en `toFormState`).
