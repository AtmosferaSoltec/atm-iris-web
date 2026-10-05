# 06 · Tiempos

## Objetivo

Contrato §14 y `IRIS_SPEC.md` §6.10 / §7.10: ver en la web los registros de tiempos que guardan las
consolas, con sus resúmenes, y (con permiso) ajustarlos o borrarlos. En pantalla grande los resúmenes
se leen mejor que en el iPad.

## Dependencias

Fases 00 y 03. Solo con el módulo `timeControl`.

## Lógica pura

- `src/domain/time-statistics.ts`: **porta** `atm-iris-ios/iris/Features/Times/TimeStatistics.swift` (léelo completo):
  `Filter { period, serviceTypeId, blockName, personId }`, periodos (`thisMonth`, `lastMonth`, `last3Months` por defecto,
  `thisYear`, `all`, `month(year, month)`), `serviceCount`, `averageDuration`, `averageOvertimePerService`,
  `overBlocks { over, total }`, `byPerson[]`, `byBlock[]`. Mismas reglas: exceso = real − previsto si > 0, sin margen;
  omitidos no cuentan; ajustados sí; periodos por mes calendario **en la zona horaria de la iglesia**; el filtro de bloque
  compara con `nameKey`. `now` y la zona se inyectan para poder probarlo (las pruebas son de la fase 08).
- Nombres: persona borrada → `personName` guardado o "Persona eliminada"; sin responsable → "Sin responsable";
  tipo borrado → `serviceTypeName` guardado.

## Repositorio

`TimeRecordRepository`: `list({ from, to, serviceTypeId, page, limit: 500 })`, `get(id)`,
`adjustBlock(recordId, blockId, { actualSeconds?, personId? })`, `delete(id)`.
Para los resúmenes carga el rango del periodo completo (páginas de 500 hasta terminar).

## Pantalla `/tiempos`

`SegmentedControl` **Registros | Resúmenes** en la URL (`tab`).

**Registros** (dos columnas en escritorio, una en móvil):
- Izquierda: filtro por tipo de servicio (URL), lista agrupada por mes ("SEPTIEMBRE 2026"): punto de color, servicio,
  fecha ("dom, 27 sept"), duración total tabular y chip de exceso ("+16:10" rojo) o "A tiempo" (verde). Seleccionado en la URL (`record`).
- Derecha: título serif del servicio, fecha larga, métricas Duración · Previsto · Exceso, y "BLOQUES" con nombre, responsable,
  barra real vs. previsto con escala común, real y exceso, chips "Ajustado" / "Omitido".
- Con `records.manage`: menú por bloque "Ajustar duración…" (diálogo con minutos y segundos) y "Cambiar responsable"
  (`select` de personas); al final "Eliminar registro" con confirmación.

**Resúmenes**:
- Filtros en la URL: periodo (incluye "Elegir mes…" con mes y año), servicio, bloque, persona.
- 4 KPIs: Servicios · Duración promedio · Exceso promedio por servicio · Bloques pasados ("12 de 20 · 60 %").
- **Por persona**: tabla (mayor exceso total primero) con participaciones, veces que se pasó, exceso promedio, máximo y total;
  clic → diálogo con sus bloques del periodo y el resumen neutro ("Se pasó en 5 de 8 bloques · promedio +6:20").
- **Por bloque**: "Se pasó 3 de 8 veces", exceso promedio y barra del real promedio vs. previsto.
- Vacío: "Aún no hay tiempos" / "Se guardan al terminar un servicio con bloques." y, con filtros, "No hay tiempos con estos filtros".
- Lenguaje neutro, sin rankings llamativos (spec §6.10).

Formatos: reutiliza y amplía `src/lib/format.ts` (`clock` "9:40" / "1:32:10", `overtime` "+4:05").

## Criterios de aceptación

- Con mocks (los 10 registros de ejemplo): las cifras de los resúmenes coinciden con las que muestra el iPad para los
  mismos datos (compara a mano dos o tres valores con la vista previa de `TimeSummaryView` del iPad).
- Compila, lint, tipos, build.

## Desviaciones

_(Completar al cerrar la fase.)_
