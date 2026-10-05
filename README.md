# Iris · Web

Panel web de Iris para preparar el contenido de la iglesia. **No proyecta**: la proyección vive en la app de escritorio (Windows) y en el iPad. Desde la web se hace lo administrativo:

- **Canciones**: crear y editar letras con vista previa de cada diapositiva tal como se ve en el TV, cargar un `.txt` en el editor o **importar varios `.txt` a la vez**.
- **Servicios**: tipos de servicio con color, horario y bloques de tiempo con responsable sugerido.
- **Personas**: responsables de bloques, para el control de horas por servicio.
- **Módulos**: Biblia, Multimedia y Control de tiempo (Letras siempre activo).
- **Acceso**: iniciar sesión, crear cuenta y recuperar contraseña con un código de 6 dígitos (3 pantallas).

> **Estado:** el acceso (crear cuenta, iniciar sesión, recuperar contraseña) ya funciona contra `atm-iris-api`. Canciones, servicios, personas y módulos siguen con datos de ejemplo en memoria (los del iPad) hasta que la API los sirva; se reinician al reiniciar el servidor.

## Requisitos

- Node.js ≥ 20.9 (ver `.nvmrc`)
- pnpm 11 (`corepack enable`)

## Desarrollo

```bash
pnpm install
cp .env.example .env.local   # opcional en desarrollo
pnpm dev                     # http://localhost:3000
```

| Script                         | Qué hace                                 |
| ------------------------------ | ---------------------------------------- |
| `pnpm dev`                     | Servidor de desarrollo (Turbopack)       |
| `pnpm build` / `pnpm start`    | Build y servidor de producción           |
| `pnpm lint`                    | ESLint (reglas de Next + React Compiler) |
| `pnpm typecheck`               | Genera los tipos de rutas y corre `tsc`  |
| `pnpm test`                    | Pruebas unitarias (Vitest)               |
| `pnpm format` / `format:check` | Prettier (+ orden de clases de Tailwind) |
| `pnpm check`                   | lint + typecheck + test                  |

## Variables de entorno

| Variable         | Por defecto           | Descripción                                                                                                              |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_SOURCE`    | `mock`                | Acceso: `api` (atm-iris-api) o `mock` (cualquier correo entra; código de recuperación `123456`)                          |
| `DATA_SOURCE`    | `mock`                | Canciones, servicios, personas y módulos. `api` cuando la API los sirva (etapas 02–04)                                   |
| `API_URL`        | —                     | URL de atm-iris-api **con** `/api/v1`. Obligatoria si alguna fuente es `api`. Local: `http://localhost:3020/api/v1`      |
| `SESSION_SECRET` | secreto de desarrollo | Cifra la cookie de sesión (lleva los tokens). **Obligatoria en producción**, ≥ 32 caracteres (`openssl rand -base64 32`) |

Se validan con zod al arrancar (`src/server/env.ts`).

Para trabajar con el acceso real, levanta la API (`cd ../atm-iris-api && pnpm start:dev`) y entra con `pastor@vidanueva.org` / `vidanueva123` (lo crea `pnpm db:seed:dev` en la API).

## Arquitectura

Next.js 16 (App Router) · React 19 + React Compiler · Tailwind CSS 4 · zod · jose.

```
src/
  app/                    Rutas. Solo componen pantallas; sin lógica de negocio.
    (auth)/login          Acceso
    (app)/                Pantallas con sesión: Inicio, canciones, servicios, personas, modulos
    api/health            Sonda de salud para Docker / balanceadores
  proxy.ts                Redirección optimista según la cookie (antes "middleware")
  components/
    ui/                   Design system: Button, TextField, Dialog, Surface, Chip, Switch…
    brand/                Logo y fondo ambiental
    projection/           SlidePreview: la diapositiva 16:9 tal como se ve en el TV
    service/              BlockTimeline
  features/<feature>/     actions.ts (Server Actions) · schemas.ts (zod) · components/
  domain/                 Modelos (iguales a IRIS_SPEC §9) y reglas puras
  lib/                    Utilidades puras: parser de letras, formato, texto
  server/                 Solo servidor (`server-only`)
    env.ts                Variables de entorno validadas
    session.ts            Sesión firmada (JWT HS256) en cookie httpOnly
    dal.ts                Data Access Layer: requireSession / authorize
    repositories/
      types.ts            Contratos (interfaces) de datos
      mock/               Implementación en memoria + datos de ejemplo
      api/                Implementación contra atm-iris-api
      index.ts            Composition root: elige mock o api según DATA_SOURCE
```

Principios (los mismos del iPad):

1. **Datos detrás de interfaces.** Las pantallas usan `repos.songs`, `repos.people`, etc. y no saben si son mocks o la API.
2. **Autorización junto a los datos.** `proxy.ts` solo redirige; cada página llama a `requireSession()` y cada Server Action a `authorize()`.
3. **Validación en el servidor** con zod en cada Server Action, con los mismos textos de error de la spec.
4. **Tokens centralizados** en `src/app/globals.css` (`@theme`). Las vistas no usan colores ni medidas sueltos.
5. **Lógica pura y probada** en `lib/` y `domain/` (parser de letras, formatos, reglas).

### Formato de letras

Lo que se pega en el editor o se sube como `.txt`:

```
[Estrofa 1]
Sublime gracia del Señor
que a un pecador salvó

Coro:
Mi corazón entona la canción
```

- Una **línea en blanco** separa diapositivas (cada una es una pantalla del TV).
- La primera línea puede nombrar la sección: `[Lo que sea]`, `Coro`, `Estrofa 2`, `Puente:`… No se proyecta.
- En la importación, el **nombre del archivo** es el título. Los que ya existen en la biblioteca o vienen vacíos se marcan y no se importan.

## Sesión y acceso

El navegador nunca ve los tokens de la API:

1. Los Server Actions de `src/features/auth/actions.ts` llaman a `/auth/*` de la API desde el servidor de Next.
2. Los tokens (access de 15 min y refresh de 60 días) se guardan **cifrados** (JWE A256GCM) en la cookie `httpOnly` `iris_session`, que vive lo mismo que el refresh token.
3. `src/proxy.ts` corre antes de cada página y Server Action. Si al access token le queda menos de un minuto, lo renueva y reescribe la cookie. Si la API rechaza el refresh, borra la cookie y manda al login. Si la API no responde, deja pasar la petición y lo intenta en la siguiente.
4. Cada página llama a `requireSession()` y cada acción a `authorize()` (`src/server/dal.ts`).
5. Las llamadas reenvían `X-Forwarded-For`, para que el límite de intentos de login de la API sea por visitante y no por servidor.

**Recuperar contraseña**: `/recuperar` (correo) → `/recuperar/codigo` (código de 6 dígitos, con "Reenviar") → `/recuperar/nueva` (contraseña y confirmación) → `/login` con aviso. El correo y el código viajan entre pasos en una cookie cifrada de 15 min, nunca en la URL.

## Conectar el resto de datos

Cuando la API exponga los endpoints de `src/server/repositories/api/index.ts` (etapas 02–04 de `atm-iris-api/docs/plans`), cambia `DATA_SOURCE=api`. Las pantallas no cambian.

## Despliegue

El build genera un servidor autónomo (`output: "standalone"`).

**Docker**

```bash
docker build -t iris-web .
docker run -p 3000:3000 \
  -e SESSION_SECRET="$(openssl rand -base64 32)" \
  -e AUTH_SOURCE=api -e API_URL=http://atm-iris-api:3001/api/v1 \
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

**CI** (`.github/workflows/ci.yml`): lint, typecheck, pruebas, formato y build en cada push a `main` y en cada PR.

> Mientras `DATA_SOURCE=mock`, los datos viven en la memoria de cada instancia: usa una sola réplica y no lo trates como persistente.
