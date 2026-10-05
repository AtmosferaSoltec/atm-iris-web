# 01 · Login y sesiones — ✅ completada

Hecha antes de este plan. Qué existe:

- Acceso real contra la API (`AUTH_SOURCE=api`): crear cuenta, iniciar sesión, cerrar sesión.
- Tokens de la API cifrados (JWE A256GCM) en la cookie `httpOnly` `iris_session`, que dura lo mismo que el refresh token (60 días).
- `src/proxy.ts` renueva el access token cuando le queda menos de un minuto, antes de cada página y Server Action;
  si la API rechaza el refresh, borra la cookie y manda al login.
- Recuperación en 3 pantallas: `/recuperar` → `/recuperar/codigo` → `/recuperar/nueva` → `/login?restablecida=1`, con el
  estado entre pasos en la cookie cifrada `iris_recovery` (15 min).
- Las llamadas reenvían `X-Forwarded-For` para que el límite de intentos de la API sea por visitante.

Detalle en el `README.md` (sección "Sesión y acceso") y en `atm-iris-api/docs/plans/01-login/README.md`.

**Ajustes pendientes** (se hacen en las fases 00 y 02, no aquí): la sesión pasa a guardar `permissions`, `churches` y
`church.timezone`; `fullName` reemplaza a `leaderName`.
