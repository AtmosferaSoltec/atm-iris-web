# Iris Web

Sitio público de Iris: hoy es solo la landing (qué hace Iris y dónde descargarlo para Windows y macOS).
Está armado para crecer con login, panel, informes y backend sin migrar nada.

## Estructura

- `src/app`: proveedores (React Query) y el router.
- `src/layouts`: un layout por zona. Hoy solo `PublicLayout`.
- `src/features/<tema>`: cada tema con sus páginas, componentes y llamadas. Hoy `landing`, `releases` y `legal`.
- `src/components/ui` y `src/components/brand`: piezas compartidas con los tokens de `src/index.css` (los mismos de la app de escritorio).
- `public/releases/latest.json`: manifiesto de ejemplo. En el servidor lo publica el flujo de release de la app de escritorio.

## Agregar login y panel más adelante

1. Crear `src/layouts/auth-layout.tsx` y `src/layouts/app-layout.tsx` (este último comprueba la sesión).
2. Agregar sus rutas en `src/app/router.tsx` junto a `PublicLayout`: `/login` y `/app/*`.
3. Poner cada pantalla nueva en `src/features/<tema>` y las llamadas al API con React Query.

La landing no cambia.

## Comandos

`pnpm dev`, `pnpm build`, `pnpm format`, `pnpm check`.

Pendiente: `pnpm lint` falla porque typescript-eslint aún no soporta TypeScript 7.
