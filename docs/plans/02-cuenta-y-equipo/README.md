# 02 · Cuenta y equipo

## Objetivo

Contrato §5 (lo que falta del auth) y §7 (equipo): perfil, cambio de contraseña, dispositivos,
cambio de iglesia, gestión del equipo e invitaciones, incluida la página pública para aceptar.

## Dependencias

Fase 00.

## Repositorios

Amplía `AuthService` (`types.ts`, `api/auth.ts`, `mock/`) con: `getSession`, `updateProfile(fullName)`,
`changePassword({ currentPassword, password, passwordConfirmation })`, `switchChurch(churchId)`, `listSessions()`,
`revokeSession(id)`, `signOutAll()`.
Nuevo `TeamRepository`: `listMembers`, `updateMemberRole(id, role)`, `removeMember(id)`, `listInvitations`,
`invite({ email, role })`, `resendInvitation(id)`, `revokeInvitation(id)`, `lookupInvitation(token)`,
`acceptInvitation({ token, fullName?, password })`.
El mock reproduce las reglas (`LAST_OWNER`, `ALREADY_MEMBER`, admin vs owner) para que las pantallas muestren los
mismos errores sin API.

## Pantallas

### Selector de iglesia (sidebar)
- Si `churches.length > 1`, el bloque de cuenta del sidebar abre un `dropdown-menu` con las iglesias (marca la actual,
  muestra el rol) → acción `switchChurch` → guarda el nuevo `AuthResult` en la cookie → `redirect("/")`.
- El menú de cuenta también lleva "Mi cuenta" y "Cerrar sesión".

### `/cuenta` — Mi cuenta (cualquier miembro)
Columna de ancho `settings` con tres paneles (`Surface`):
1. **Perfil**: nombre (`fullName`, editable) y correo (solo lectura). "Guardar".
2. **Contraseña**: actual, nueva, confirmar → `changePassword`. Éxito: toast "Contraseña actualizada. Cerramos tus otras sesiones."
   Error `INVALID_CURRENT_PASSWORD` en el campo "Contraseña actual".
3. **Dispositivos**: lista de `DeviceSession` (ícono por plataforma: web/iPad/Windows, `deviceName` o "Navegador",
   "Último uso hace 3 días" en español y zona de la iglesia, IP en `ink-3`, chip "Este dispositivo"). Botón "Cerrar sesión"
   por fila (confirmación) y, al final, "Cerrar sesión en todos los dispositivos" (danger, confirmación; termina en `/login`).

### `/equipo` — Equipo (lectura para todos; acciones con `members.manage`)
- Encabezado "Equipo" + "Quienes pueden entrar a {iglesia} y qué pueden hacer." + primario "Invitar" (permiso).
- Lista de miembros: avatar, nombre, correo, `Chip` de rol (Dueño ámbar · Administrador violeta · Operador índigo),
  "Tú" en el propio. Menú por fila (permiso): "Cambiar rol" (submenú con los roles permitidos) y "Quitar del equipo"
  (confirmación: "¿Quitar a {nombre}? Dejará de tener acceso a esta iglesia en todos sus dispositivos.").
  Oculta las opciones que la regla no permite (admin sobre owner, asignar owner sin ser owner).
- Sección "Invitaciones pendientes": correo, rol, "Vence el …", acciones "Reenviar" y "Revocar".
- Diálogo "Invitar": correo + rol (`select` con descripción de cada rol en una línea: Administrador — "Gestiona todo
  menos el traspaso de la iglesia." · Operador — "Usa la consola y registra tiempos.") → toast "Invitación enviada a {correo}".
- Tabla de qué puede cada rol: un `popover` "¿Qué puede hacer cada rol?" junto al título, generado desde `ROLE_PERMISSIONS`.

### `/invitacion?token=` — Aceptar invitación (pública)
- Agrega `/invitacion` a `PUBLIC_PATHS` en `proxy.ts`. Si hay sesión abierta, **no** redirigir: muestra la invitación igual
  (puede ser otra cuenta) y al aceptar reemplaza la sesión.
- Mismo layout que `/recuperar`. Carga `lookupInvitation(token)`:
  - Inválida/vencida: estado vacío "Esta invitación ya no es válida" + "Pídele a quien te invitó que te envíe otra." + link al login.
  - Válida: "{invitedByName} te invitó a **{churchName}** como {rol}". Correo en solo lectura.
    - `hasAccount: false`: nombre, contraseña (mínimo 8) → "Unirme".
    - `hasAccount: true`: "Ya tienes una cuenta de Iris con este correo." + contraseña → "Unirme".
- Éxito: guarda la sesión y `redirect("/")` con toast "Te uniste a {iglesia}".

## Criterios de aceptación

- Con mocks: todo el flujo de equipo funciona, incluidos los errores de reglas.
- Un `operator` ve `/equipo` sin botones de acción.
- Compila, lint, tipos, build.

## Desviaciones

_(Completar al cerrar la fase.)_
