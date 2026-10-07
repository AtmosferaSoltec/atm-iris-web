# Iris · Web

Panel web de Iris para administrar la iglesia. **No proyecta**: la proyección vive en las consolas (iPad y Windows). Desde la web se hace lo administrativo, contra el mismo contrato que usan las consolas (`docs/api-contract.md`):

- **Inicio**: saludo y fecha en la zona de la iglesia, próximo servicio con sus bloques y tarjetas de cada sección.
- **Canciones**: biblioteca con búsqueda, orden y paginación en el servidor; editor con vista previa de cada diapositiva tal como se ve en el TV; importación de varios `.txt`.
- **Multimedia**: imágenes, videos y música. La subida va del navegador directo al almacenamiento (URL firmada), con progreso, metadatos medidos en el navegador, cuota visible y fondos para la consola.
- **Servicios**: tipos de servicio con color, horario y bloques de tiempo con responsable sugerido.
- **Personas**: responsables de bloques.
- **Tiempos**: registros que guardan las consolas, con ajustes, y resúmenes por periodo, servicio, bloque y persona.
- **Mi cuenta**: perfil, contraseña y dispositivos con sesión abierta.
- **Ajustes**: nombre y zona horaria de la iglesia, módulos y almacenamiento.
- **Acceso**: iniciar sesión, crear cuenta y recuperar la contraseña con un código de 6 dígitos.

Cada iglesia tiene una sola cuenta, sin roles ni equipo (contrato §3): quien entra con ella puede hacer todo. La misma cuenta sirve en la web, el iPad y Windows.

## Requisitos

- Node.js ≥ 20.9 (ver `.nvmrc`)
- pnpm 11 (`corepack enable`)

## Desarrollo

```bash
pnpm install
cp .env.example .env.local
pnpm dev                     # http://localhost:3000
```

| Script                         | Qué hace                                                      |
| ------------------------------ | ------------------------------------------------------------- |
| `pnpm dev`                     | Servidor de desarrollo (Turbopack). Uno solo por carpeta      |
| `pnpm build` / `pnpm start`    | Build y servidor de producción                                |
| `pnpm lint`                    | ESLint (reglas de Next + React Compiler)                      |
| `pnpm typecheck`               | Genera los tipos de rutas y corre `tsc`                       |
| `pnpm test`                    | Pruebas unitarias (Vitest)                                    |
| `pnpm test:e2e`                | Pruebas de interfaz (Playwright) contra un build en modo mock |
| `pnpm format` / `format:check` | Prettier (+ orden de clases de Tailwind)                      |
| `pnpm check`                   | lint + typecheck + test                                       |

### Con la API

```bash
cd ../atm-iris-api && pnpm start:dev        # http://localhost:3020/api/v1
cd ../atm-iris-web && pnpm dev              # AUTH_SOURCE=api, DATA_SOURCE=api
```

Cuenta de desarrollo (la siembra la API): `pastor@vidanueva.org` / `vidanueva123`. La multimedia necesita MinIO (`docker compose -f docker-compose.dev.yml up -d` en `atm-iris-api`) con CORS que permita el `PUT` desde `http://localhost:3000`.

### Sin la API (mocks)

`AUTH_SOURCE=mock DATA_SOURCE=mock pnpm dev`. Los datos viven en memoria y se reinician al reiniciar el servidor:

- Cuenta: `pastor@vidanueva.org` (Iglesia Vida Nueva). Cualquier contraseña sirve para entrar; cualquier otro correo entra como el pastor y `error@…` simula credenciales incorrectas. La contraseña de ejemplo es `vidanueva123`.
- Recuperación: el código es siempre `123456` (también sale en el log del servidor).
- Los mismos datos de ejemplo del iPad (8 personas, 3 servicios, 10 registros de tiempos, himnos de dominio público).
- La multimedia se guarda en memoria a través de `/api/mock-storage/[key]`, que solo existe con `DATA_SOURCE=mock`.

## Variables de entorno

| Variable         | Por defecto           | Descripción                                                                                                              |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_SOURCE`    | `mock`                | Cuentas: acceso, sesión y dispositivos. `api` (atm-iris-api) o `mock`                                                    |
| `DATA_SOURCE`    | `mock`                | Contenido de la iglesia: ajustes, personas, servicios, canciones, multimedia y tiempos. `api` o `mock`                   |
| `API_URL`        | —                     | URL de atm-iris-api **con** `/api/v1`. Obligatoria si alguna fuente es `api`. Local: `http://localhost:3020/api/v1`      |
| `SESSION_SECRET` | secreto de desarrollo | Cifra la cookie de sesión (lleva los tokens). **Obligatoria en producción**, ≥ 32 caracteres (`openssl rand -base64 32`) |

Se validan con zod al arrancar (`src/server/env.ts`). `.env.example` trae las dos fuentes en `api`.

## Arquitectura

Next.js 16 (App Router) · React 19 + React Compiler · Tailwind CSS 4 · zod · jose · radix-ui · nuqs · sonner.

```
src/
  app/                    Rutas. Páginas delgadas: metadata + carga de datos + la vista del feature
    (auth)/               login, recuperar (3 pasos)
    (app)/                Con sesión: Inicio, canciones, multimedia, servicios, personas, tiempos,
                          cuenta, ajustes (+ loading, error y not-found propios)
    api/health            Sonda de salud
    api/session/expired   Borra una cookie muerta y manda al login (las páginas no pueden escribir cookies)
    api/mock-storage      Almacenamiento simulado (solo DATA_SOURCE=mock)
  proxy.ts                Redirección según la cookie y renovación del access token
  components/
    ui/                   Sistema de diseño: Button, TextField, Dialog, Select, Combobox, DropdownMenu,
                          Popover, Tooltip, Toaster, PermissionGate, Pagination, Skeleton…
    brand/ projection/ service/
  features/<feature>/     actions.ts (Server Actions) · schemas.ts (zod) · components/
  domain/                 Modelos del contrato y reglas puras: tiempos, próximo servicio, multimedia
  lib/                    Utilidades puras: letras, formatos, zona horaria, parámetros de la URL
  server/                 Solo servidor
    env.ts                Variables de entorno validadas
    session*.ts           Sesión cifrada en cookie httpOnly
    dal.ts                requireSession / requirePermission / authorize
    repositories/
      types.ts            Contratos (interfaces) de datos
      api/                Implementación contra atm-iris-api (cliente HTTP, errores, mappers)
      mock/               Implementación en memoria con las mismas reglas
      index.ts            Composition root: elige mock o api
```

### Decisiones respecto a `forma-de-trabajo.md`

| La casa usa                                           | Iris web                                                                                                | Motivo                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Navegador → API por rewrite, cookie puesta por el API | **BFF**: Server Components y Server Actions llaman al API; tokens cifrados en cookie propia             | Las consolas necesitan refresh token; la web es un cliente más del mismo contrato    |
| TanStack Query en el cliente                          | **Server Components + Server Actions + `revalidatePath`**                                               | Con el BFF los datos ya se cargan en el servidor; TanStack Query duplicaría la caché |
| react-hook-form                                       | `useActionState` + Zod en el servidor; estado local para editores complejos                             | Formularios cortos; el patrón ya se usa en todo el repo                              |
| shadcn/ui + Tabler                                    | **Primitivos de `radix-ui`** envueltos en `src/components/ui` con los tokens de Iris; íconos **lucide** | Iris tiene su propio sistema visual (el del iPad); Radix da la accesibilidad         |
| nuqs para filtros en la URL                           | **Se adopta** (`src/lib/search-params.ts`)                                                              | Búsqueda, paginación y filtros compartibles y que sobreviven al recargar             |
| sonner para toasts                                    | **Se adopta**, restilizado (`src/components/ui/toaster.tsx`)                                            | Avisos breves tras guardar                                                           |

### Principios

1. **Datos detrás de interfaces.** Las pantallas usan `repos.songs`, `repos.media`, etc. y no saben si son mocks o la API. Cada interfaz tiene dos implementaciones a la par: `api/` y `mock/` (mismas reglas: duplicados por _nameKey_, cuota).
2. **Una cuenta por iglesia.** No hay roles ni permisos: las pantallas muestran todo y las acciones solo exigen una sesión válida (`requireSession`, `authorize`).
3. **Errores del API tal cual.** `ApiError` lleva `code`, `message` y `errors`; `toFormState` los pone en el campo del formulario o en el aviso general.
4. **Zona de la iglesia.** Fechas, saludos, "hoy" y periodos se calculan en `church.timezone` (`src/lib/zoned-time.ts`), nunca en la del navegador ni la del servidor.
5. **Tokens centralizados** en `src/app/globals.css` (`@theme`). Las vistas no usan colores ni medidas sueltos.
6. **Lógica pura y probada** en `lib/` y `domain/` (letras, formatos, estadísticas de tiempos, próximo servicio).

### Formato de letras

```
[Estrofa 1]
Sublime gracia del Señor
que a un pecador salvó

Coro:
Mi corazón entona la canción
```

- Una **línea en blanco** separa diapositivas (cada una es una pantalla del TV).
- La primera línea puede nombrar la sección: `[Lo que sea]`, `Coro`, `Estrofa 2`, `Puente:`… No se proyecta.
- En la importación, el **nombre del archivo** es el título. Los que ya están en la biblioteca se avisan antes y el servidor los salta.

## Sesión y acceso

El navegador nunca ve los tokens de la API:

1. Las Server Actions llaman a `/auth/*` de la API desde el servidor de Next.
2. Los tokens (access de 15 min y refresh de 60 días) se guardan **cifrados** (JWE A256GCM) en la cookie `httpOnly` `iris_session`, junto con lo que la web necesita de la sesión: usuario e iglesia (con zona horaria).
3. `src/proxy.ts` corre antes de cada página y Server Action. Si al access token le queda menos de un minuto, lo renueva y reescribe la cookie. Si la API rechaza el refresh, borra la cookie y manda al login. Si la API no responde, deja pasar la petición y lo intenta en la siguiente.
4. Si una llamada de datos responde `401` (sesión cerrada desde otro dispositivo, contraseña cambiada…), el DAL borra la cookie y vuelve al login.
5. Las llamadas reenvían `X-Forwarded-For`, para que el límite de intentos de la API sea por visitante.
6. Cambiar de iglesia, editar el perfil o el nombre de la iglesia reescribe la cookie con la sesión nueva.

**Recuperar contraseña**: `/recuperar` → `/recuperar/codigo` → `/recuperar/nueva` → `/login` con aviso. El correo y el código viajan entre pasos en una cookie cifrada de 15 min, nunca en la URL.

## Pruebas

- **Unitarias** (`pnpm test`, Vitest, `src/**/*.test.ts`): letras, `nameKey`, formatos y fechas en zona horaria, estadísticas de tiempos (incluidas las cifras del iPad), próximo servicio, mappers del cliente API, `toFormState` y mocks. Corren en CI.
- **Interfaz** (`pnpm test:e2e`, Playwright, `e2e/`): acceso y recuperación, canciones, servicios, personas, multimedia y tiempos. Construye la app y la sirve en el puerto 3200 en modo mock, así no depende de la API ni choca con un `pnpm dev` abierto. La primera vez: `pnpm exec playwright install chromium`.

## Despliegue

El build genera un servidor autónomo (`output: "standalone"`).

**Docker**

```bash
docker build -t iris-web .
docker run -p 3000:3000 \
  -e SESSION_SECRET="$(openssl rand -base64 32)" \
  -e AUTH_SOURCE=api -e DATA_SOURCE=api -e API_URL=http://atm-iris-api:3001/api/v1 \
  iris-web
```

La imagen corre como usuario sin privilegios y trae `HEALTHCHECK` contra `/api/health`.

**Sin Docker**

```bash
pnpm build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
SESSION_SECRET=... node .next/standalone/server.js
```

Detrás de un proxy con **HTTPS** (la cookie de sesión es `Secure` en producción). `next.config.ts` añade cabeceras de seguridad (HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).

**CI** (`.github/workflows/ci.yml`): lint, typecheck, pruebas unitarias, formato y build en cada push a `main` y en cada PR.

> Con `DATA_SOURCE=mock` los datos viven en la memoria de cada instancia: usa una sola réplica y no lo trates como persistente.
