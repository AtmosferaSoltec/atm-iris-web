# 00 · Fundamentos

## Objetivo

Preparar la base que usan todas las fases: modelos alineados al contrato, un cliente HTTP con
paginación, permisos en la sesión, primitivos accesibles (menús, select, popover, tooltip, toasts)
con el diseño de Iris y filtros en la URL.

## Decisiones respecto a `forma-de-trabajo.md`

| La casa usa                                           | Iris web                                                                                                                            | Motivo                                                                                                                    |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Navegador → API por rewrite, cookie puesta por el API | **BFF**: Server Components y Server Actions llaman al API; tokens cifrados en cookie propia                                         | Las consolas necesitan refresh token; la web es un cliente más del mismo contrato (plan 01 de la API)                     |
| TanStack Query en el cliente                          | **Server Components + Server Actions + `revalidatePath`**                                                                           | Con el BFF los datos ya se cargan en el servidor; TanStack Query duplicaría la caché                                      |
| react-hook-form                                       | `useActionState` + Zod en servidor; estado local para editores complejos                                                            | Patrón ya usado en todo el repo; formularios cortos                                                                       |
| shadcn/ui + Tabler                                    | **Primitivos de `radix-ui`** envueltos en `src/components/ui` con los tokens de Iris; íconos **lucide** (ya usados en todo el repo) | Iris tiene su propio sistema visual (el del iPad); shadcn trae estilos que habría que deshacer. Radix da la accesibilidad |
| nuqs para filtros en la URL                           | **Se adopta**                                                                                                                       | Búsqueda, paginación y filtros compartibles y que sobreviven al recargar                                                  |
| sonner para toasts                                    | **Se adopta**, restilizado                                                                                                          | Avisos de éxito tras guardar                                                                                              |

Anota estas decisiones en el `README.md` (sección Arquitectura).

## Pasos

### 1. Modelos del contrato

- `src/domain/models.ts`: alinea con `docs/api-contract.md`. Agrega `Role`, `Permission`, `SessionView` (lo que la web
  guarda de la sesión: usuario, iglesia con `timezone`, rol, permisos, iglesias), `Church` (con `modules` y `storage`),
  `Member`, `Invitation`, `InvitationPreview`, `DeviceSession`, `SongSummary`, `Song` (con `copyright`), `MediaAsset`,
  `UploadTicket`, `ServiceRecord` con `serviceTypeName`, `Person` con `blockCount`, `Paginated<T>`.
  Los nombres de campos son los del contrato (por ejemplo `fullName`; elimina `leaderName` en todo el repo).
- `UserSession` (lo que viaja en la cookie) pasa a ser `{ userId, email, fullName, church: { id, name, timezone }, role,
permissions, churches }`. Ajusta `session-token.ts`, `dal.ts`, `api/auth.ts`, el mock y todos los usos.

### 2. Cliente HTTP

- `api/client.ts`: agrega soporte de **listas paginadas** (`requestPage<T>()` que devuelve `{ data, meta }` sin desempaquetar)
  y de query strings (`query` opcional que omite vacíos).
- Errores: `ApiError` ya trae `code`, `message`, `errors`. Agrega `src/server/repositories/api/errors.ts` con un helper
  `toFormState(error, fieldNames)` que convierte un `ApiError` en el `FormState` de los formularios (errores por campo con
  los nombres del formulario, o mensaje general). Úsalo en todas las acciones nuevas.
- Un `401` en cualquier llamada de datos (no de auth) significa que la sesión murió entre el proxy y la llamada:
  `deleteSession()` y `redirect("/login")` desde el DAL (helper `handleUnauthorized`).

### 3. Permisos

- `src/lib/permissions.ts`: el catálogo del contrato §3 y `can(session, permission)`.
- `requirePermission(permission)` en `dal.ts` para acciones (lanza `Forbidden`) y páginas (`notFound()` si el rol no la tiene,
  coherente con "404 en vez de 403").
- Componente `<PermissionGate permission mode="hide|disable">` en `src/components/ui` (recibe la sesión por props desde el
  servidor; no lee contexto global).

### 4. Primitivos accesibles

- `pnpm add radix-ui sonner nuqs`.
- En `src/components/ui`: `dropdown-menu.tsx`, `select.tsx` (reemplaza el `select` nativo donde haya menús de personas),
  `popover.tsx`, `tooltip.tsx`, `toaster.tsx` (sonner con fondo `elevated`, borde `line`, texto `ink`) y migra `dialog.tsx`
  a `radix-ui` Dialog conservando su API pública (`open`, `onClose`, `title`, `description`, `footer`, `size`) para no tocar
  a quienes lo usan.
- Todos con tokens de `globals.css`; nada de colores sueltos.
- `<Toaster />` en el layout raíz. Las acciones exitosas de guardar muestran un toast breve ("Canción guardada").

### 5. Filtros en la URL

- `NuqsAdapter` en el layout raíz (`nuqs/adapters/next/app`).
- `src/lib/search-params.ts` con los parsers compartidos (`page`, `search`, `kind`…).

### 6. Navegación

- `nav-items.ts`: agrega las entradas de las fases siguientes con su permiso de lectura o módulo:
  Inicio · Canciones · Multimedia (módulo `multimedia`) · Servicios · Personas (módulo `timeControl`) ·
  Tiempos (módulo `timeControl`) · Equipo · Ajustes. Las páginas que aún no existan quedan sin entrada hasta su fase.

## Criterios de aceptación

- `pnpm lint && pnpm typecheck && pnpm build` en verde; la app sigue funcionando en modo mock.
- No queda ningún `leaderName` ni `churchName` suelto en la sesión.

## Desviaciones

- **`UserSession.sessionId`** (además de lo que pide el paso 1): el id de la sesión del API de este navegador.
  Lo usa el mock para marcar "Este dispositivo"; con el API real lo resuelve `isCurrent`.
- **Permisos en el DAL**: `requirePermission(permission)` es para páginas (`notFound()`); las Server Actions usan
  `authorize(permission)`, que lanza `ApiError` 403 `FORBIDDEN` en vez de una clase `Forbidden` aparte, para que
  `toFormState` / `errorMessage` lo muestren igual que si lo rechazara el API.
- **`AuthError` desaparece**: auth, mocks y datos lanzan el mismo `ApiError` (`src/server/repositories/api/errors.ts`,
  sin `server-only` para poder probarlo).
- **Sesión vencida al renderizar**: un Server Component no puede borrar cookies, así que `handleUnauthorized`
  redirige a `/api/session/expired` (route handler que borra la cookie y manda a `/login`). En Server Actions la
  borra directamente.
- **`TeamRepository` sigue a `AUTH_SOURCE`**, no a `DATA_SOURCE`: miembros e invitaciones viven con las cuentas.
  Así, con `AUTH_SOURCE=api` y `DATA_SOURCE=mock`, aceptar una invitación devuelve tokens reales.
- **`select.tsx`** exporta el `Select` de Radix y conserva el nativo como `NativeSelect` para hora y minutos (la rueda
  del sistema es más cómoda en móvil).
- **Cookies anteriores** (sin `permissions` ni `church.timezone`) se tratan como sesión ausente: piden iniciar sesión
  otra vez en lugar de romper las páginas.
- ESLint: `no-unused-vars` ignora nombres con prefijo `_` (campos descartados al copiar un objeto).
