# 08 · Calidad y entrega

## Objetivo

Dejar la web lista para la integración: modo API por defecto, pruebas de lo importante,
documentación al día y el reporte final.

## 1. Modo API

- `.env.example`: `AUTH_SOURCE=api`, `DATA_SOURCE=api`. Los mocks quedan para desarrollo sin API y para las pruebas de interfaz.
- Si la API ya tiene los endpoints (`pnpm start:dev` en `../atm-iris-api`, cuenta `pastor@vidanueva.org` / `vidanueva123`),
  recorre la web con `DATA_SOURCE=api` y corrige lo que no coincida **de tu lado**. Lo que sea del API, anótalo para el revisor.
  Si la API todavía no está completa, recorre con mocks y deja la integración como pendiente en el reporte.

## 2. Pruebas

Unitarias (Vitest, `src/**/*.test.ts`) — al menos:
- `lib/lyrics.ts` (ya existen; amplía con casos de importación).
- `lib/text.ts` (`nameKey` idéntico al contrato §2, con espacios internos).
- `domain/time-statistics.ts` (periodos con zona horaria, excesos, omitidos, ajustados, por persona y por bloque).
- `domain/next-service.ts`.
- `lib/permissions.ts` contra la tabla del contrato.
- Mappers del cliente API (respuesta de ejemplo del contrato → modelos).
- `api/errors.ts` (`toFormState`).

Interfaz (Playwright, `pnpm add -D @playwright/test`, `e2e/`, contra `pnpm dev` en **modo mock** para que no dependa de la API):
- Login, crear cuenta con errores, recuperación en 3 pasos (código `123456` del mock).
- Canciones: crear, buscar, importar `.txt`.
- Servicios: crear con bloques, duplicado.
- Personas: agregar, duplicado, renombrar.
- Equipo: invitar, cambiar rol, `LAST_OWNER`.
- Multimedia: subir una imagen con progreso, marcar como fondo.
- Tiempos: ver un registro, ajustar un bloque.
- Un `operator` no ve acciones de administración.
Script `pnpm test:e2e`. Agrega el job al CI (`.github/workflows/ci.yml`) solo para las unitarias.

`pnpm check && pnpm format:check && pnpm build && pnpm test:e2e` en verde.

## 3. Documentación

- `README.md`: funcionalidades, variables, arquitectura (incluye las decisiones de la fase 00), sesión, cómo correr con
  y sin API, pruebas.
- `AGENTS.md`: actualiza "Project conventions" si cambió algo (permisos, primitivos, nuqs).

## 4. Reporte

Entrega el reporte de `00-fundamentos/plataforma.md` §6 y pregunta al usuario si puede dar el repo por terminado.

## Desviaciones

_(Completar al cerrar la fase.)_
