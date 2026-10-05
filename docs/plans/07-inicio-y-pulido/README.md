# 07 · Inicio y pulido

## Objetivo

Que el panel de Inicio muestre datos reales y útiles, y que toda la web quede pareja: estados de carga,
vacíos y error, accesibilidad, móvil y textos.

## Dependencias

Fases 02–06.

## Inicio (`/`)

- Saludo actual (fecha y saludo en la **zona de la iglesia**, no la del navegador ni la del servidor).
- **Próximo servicio** (tarjeta grande, como el hero del iPad pero sin "Iniciar servicio"): el tipo con horario más próximo
  desde ahora en la zona de la iglesia (hasta 2 h después de su inicio cuenta como "Servicio de hoy"), con color, horario,
  `BlockTimeline` y lista de bloques con responsable sugerido. Sin tipos: "Crea tu primer servicio" + "Configurar servicios".
  La regla vive en `src/domain/next-service.ts` (función pura con `now` y zona inyectados).
- Tarjetas: Canciones (total + 3 recientes) · Multimedia (conteo por tipo + barra de cuota; si el módulo está encendido) ·
  Servicios · Personas y Tiempos (último registro: "Culto general · dom 27 sept · +16:10"; si `timeControl`) · Equipo
  (avatares + pendientes de invitación si `members.manage`) · Ajustes (módulos).
- Acciones rápidas según permisos: "Subir canción", "Subir multimedia", "Invitar".
- Carga en paralelo y con `Suspense` por tarjeta, para que una lenta no frene el resto.

## Pulido transversal

- `loading.tsx` con esqueletos por sección en vez de spinner global; `error.tsx` por segmento con "Reintentar".
- Toda acción destructiva con confirmación; toda acción de guardar con toast.
- Teclado: foco visible en todo, `Esc` cierra diálogos, atajos `/` (enfocar búsqueda en Canciones y Multimedia).
- Accesibilidad: etiquetas en botones de ícono, `aria-current` en la navegación, contraste de `ink-3` sobre `surface`
  (sube a `ink-2` donde no cumpla 4.5:1 en textos pequeños).
- Móvil (390 px): sin desbordes horizontales en ninguna página; tablas de Tiempos con desplazamiento propio.
- Metadatos por página (`title`), `not-found` dentro del layout autenticado para recursos inexistentes.
- Revisa todos los textos contra `IRIS_SPEC.md` §13 y la consistencia de términos (glosario de `atm-iris-api/docs/conventions.md`).
- Elimina código y mocks que ya no se usen (por ejemplo `ModuleSettingsRepository`, `blockCountsByPerson` si quedó sin uso).

## Criterios de aceptación

- Recorrido completo en modo mock sin errores en consola del navegador, en escritorio y a 390 px.
- Compila, lint, tipos, build.

## Desviaciones

_(Completar al cerrar la fase.)_
