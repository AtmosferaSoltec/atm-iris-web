# Planes de implementación · atm-iris-web

> **Para el agente de la web.** Este es tu punto de partida. Trabajas en la **Mac**, solo en este
> repo, las fases en orden y sin detenerte entre ellas (reglas completas en
> [`00-fundamentos/plataforma.md`](00-fundamentos/plataforma.md) §4).

## Lee antes de empezar

1. [`00-fundamentos/plataforma.md`](00-fundamentos/plataforma.md): producto, arquitectura y reglas de trabajo.
2. [`../api-contract.md`](../api-contract.md): el contrato de la API. **La API se está construyendo a la vez que tú**:
   implementa contra el contrato aunque el endpoint todavía no exista.
3. `../../../atm-iris-ios/IRIS_SPEC.md`: diseño, textos y reglas (§3–4 tokens, §6.6–6.10 pantallas de iglesia, §7.8–7.10 reglas).
4. [`../../AGENTS.md`](../../AGENTS.md) y [`../../README.md`](../../README.md): convenciones y arquitectura actuales.
   **Next.js 16 tiene cambios**: lee la guía correspondiente en `node_modules/next/dist/docs/` antes de usar una API que no conozcas.
5. `../../../forma-de-trabajo.md` (carpeta `Atmosfera/`): convenciones de la casa. La fase 00 explica qué se adopta y qué no.

## Comandos

| Para                   | Comando                                            |
| ---------------------- | -------------------------------------------------- |
| Desarrollo             | `pnpm dev` (puerto 3000)                           |
| Verificar en cada fase | `pnpm lint && pnpm typecheck && pnpm build`        |
| Formato                | `pnpm format`                                      |
| Pruebas (solo fase 08) | `pnpm test` · `pnpm test:e2e` (la crea la fase 08) |

`.env.local` actual: `AUTH_SOURCE=api`, `DATA_SOURCE=mock`. Mientras la API no tenga un endpoint, usa los mocks
(`DATA_SOURCE=mock`) para ver las pantallas. Si quieres probar el login real, la API se arranca con `pnpm start:dev`
en `../atm-iris-api` (no la modifiques).

## Fases

| #   | Fase                                                                                                                          | Estado                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 00  | [Fundamentos](00-fundamentos/README.md): tipos del contrato, cliente HTTP, permisos, primitivos accesibles, filtros en la URL | [x]                                      |
| 01  | [Login y sesiones](01-login/README.md)                                                                                        | [x] ya hecha (con ajustes en la fase 02) |
| 02  | [Cuenta y equipo](02-cuenta-y-equipo/README.md): perfil, contraseña, dispositivos, cambio de iglesia, equipo, invitaciones    | [x]                                      |
| 03  | [Iglesia](03-iglesia/README.md): ajustes, módulos, personas, servicios contra el contrato                                     | [x]                                      |
| 04  | [Canciones](04-canciones/README.md): búsqueda en el servidor y paginación                                         | [x]                                      |
| 05  | [Multimedia](05-multimedia/README.md): subida directa al almacenamiento, biblioteca, fondos                                   | [x]                                      |
| 06  | [Tiempos](06-tiempos/README.md): registros y resúmenes                                                                        | [x]                                      |
| 07  | [Inicio y pulido](07-inicio-y-pulido/README.md): panel con datos reales, estados, accesibilidad, móvil                        | [x]                                      |
| 08  | [Calidad y entrega](08-calidad-y-entrega/README.md): pruebas, documentación, reporte                                          | [x]                                      |
| 09  | [Música en la nube](09-musica/README.md): sección Música, Canciones → Letras, almacenamiento por sección                      | [x]                                      |

Marca cada casilla al terminar la fase y completa su sección _Desviaciones_.

## Reglas propias de este repo

- Las del `AGENTS.md`: datos solo por las interfaces de `src/server/repositories/types.ts`; páginas con
  `requireSession()`, Server Actions con `authorize()`; Zod en cada acción; tokens de `globals.css` y componentes de
  `src/components/ui`; `process.env` solo en `src/server/env.ts`.
- **Cada interfaz de repositorio tiene dos implementaciones** que se mantienen a la par: `api/` (contra el contrato)
  y `mock/` (en memoria, con la misma forma de datos y las mismas reglas: duplicados, permisos). El modo `mock` sigue
  sirviendo para desarrollar sin API y para las pruebas de interfaz.
- Las acciones que el rol no permite **no se muestran** (o se muestran deshabilitadas con explicación donde la
  spec lo pida). La API igual las rechaza: la web nunca es la única barrera.
- Textos en español exactamente como la spec; los mensajes de error del API se muestran tal cual.
- Páginas delgadas: metadata + carga de datos + la vista del feature.
