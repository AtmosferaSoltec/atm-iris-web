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
  `BlockTimeline` y lista de bloques con su duración. Sin tipos: "Crea tu primer servicio" + "Configurar servicios".
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

- **Próximo servicio**: `src/domain/next-service.ts`. Entre los tipos con horario gana el que empieza antes desde
  `ahora − 2 h`; es "Servicio de hoy" si cae en la fecha de hoy de la iglesia. Sin horarios, el primero ("Sin
  horario"). Sin tipos, "Crea tu primer servicio" con "Configurar servicios" (solo con `serviceTypes.manage`).
- **Tarjetas**: Canciones · Multimedia · Servicios · Tiempos · Personas · Equipo · Ajustes, en una cuadrícula de
  hasta tres columnas (la del iPad no tiene Multimedia, Equipo ni Ajustes). Cada una carga en su `Suspense`.
- **Carga y errores**: un solo `loading.tsx` con esqueleto de página para `(app)` y el `error.tsx` de `(app)` con
  "Reintentar" cubre todos los segmentos (se ve dentro del layout). No se agregaron uno por segmento porque serían
  idénticos.
- **Contraste**: los textos pequeños pasaron de `ink-3` a `ink-2` (pistas, subtítulos de tarjetas, encabezados en
  mayúsculas, tamaños de archivo, IP…). `ink-3` queda en íconos, marcadores de posición y bloques omitidos (la spec
  los pide atenuados).
- **Recorrido a 390 px** de todas las páginas: sin desbordes horizontales; las tablas de Tiempos se desplazan
  dentro de su panel. Sin errores en la consola del navegador (salvo el 404 esperado de una ruta inexistente).
- `/modulos` redirige a `/ajustes`; `not-found.tsx` propio dentro del layout autenticado.
