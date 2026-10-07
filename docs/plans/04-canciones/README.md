# 04 · Canciones

## Objetivo

Contrato §10: biblioteca de letras con búsqueda y paginación en el servidor. Cada canción tiene solo **título,
autor y letra**: no hay derechos de autor ni importación de archivos `.txt` (se escriben una a una desde
"Nueva canción").

## Dependencias

Fases 00 y 03.

## Repositorio

`SongRepository`: `list({ search, page, limit, sort })` → `Paginated<SongSummary>`, `get(id)`, `create(input)`,
`update(id, input)` (PUT), `delete(id)`.
El mock implementa búsqueda sin acentos (con `nameKey`) y paginación igual que el API.

## Pantallas

### `/canciones`

- `search` y `page` en la URL con `nuqs` (`shallow: false` para que el servidor vuelva a cargar).
  Campo de búsqueda con espera de 300 ms antes de actualizar la URL. Mantén el foco al recargar.
- Lista con `SongSummary`. Paginación al pie: "1–20 de 134" + anterior/siguiente.
- Orden: siempre por título; la pantalla solo tiene el buscador (sin selector de orden).
- Un solo botón de crear ("Nueva canción", arriba): el estado vacío no lo repite.

### Editor (`/canciones/nueva`, `/canciones/[id]`)

- Campos: Título, Autor (opcional) y Letra. Guardar usa `create` / `update`.
- Parser `src/lib/lyrics.ts` y vista previa en vivo, una diapositiva por bloque.

#### Formato de la letra

- Una **línea en blanco** separa diapositivas.
- El **nombre de una diapositiva** es opcional: si la primera línea del bloque empieza con `#`, el resto de esa
  línea es el nombre (texto libre, ≤ 40 caracteres): `#Coro`, `# Estrofa 2`, `#Lo que quieras`. Esa línea no se proyecta.
  Un `#Coro` solo en su bloque nombra el bloque siguiente. Sin `#` la diapositiva no tiene nombre
  (la vista previa muestra "Diapositiva N").
- Ejemplo (10 líneas, 5 diapositivas, solo la tercera y la quinta con nombre):

  ```
  Línea 1
  Línea 2

  Línea 3
  Línea 4

  #Verso
  Línea 5
  Línea 6

  Línea 7
  Línea 8

  #Coro
  Línea 9
  Línea 10
  ```

- Los formatos anteriores (`[Coro]`, `Coro:`) ya no se reconocen como nombres: se toman como letra.
- El nombre viaja al API como `label` de la sección (contrato §10); al editar una canción se vuelve a escribir como `#nombre`.

## Criterios de aceptación

- Con mocks: crear, buscar por título/autor/letra, paginar y borrar; el estado queda en la URL.
- `#Coro` en la letra aparece como nombre de la diapositiva en la vista previa.
- Compila, lint, tipos, build.

## Desviaciones

- **Orden**: ya no hay selector; la web pide siempre `sort=title`. Con búsqueda el API ordena por relevancia.
- **Retirado el 2026-10-07**: importación de `.txt` (diálogo, "Cargar desde .txt", `POST /songs/import`) y el campo
  `copyright` (también en el API, con migración).
- Atajo `/` para enfocar la búsqueda (`src/lib/use-slash-focus.ts`).
- Errores `sections.N.*` del API se muestran en el campo "Letra" (alias en `toFormState`).
