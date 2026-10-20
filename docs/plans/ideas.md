# Ideas por decidir

Ideas anotadas antes de convertirse en fase. Cuando una se apruebe, pasa a `docs/plans/NN-nombre/README.md` y se
quita de aquí.

## 1. Biblia: solo Reina-Valera 1909 (ya cubierta)

- La 1960 tiene derechos de autor y no hay licencia, así que **RVR1909 (dominio público) es la única traducción**.
- Ya está así: contrato §13 (`rvr1909`) y `plataforma.md` ("solo se carga RVR1909"). No hay trabajo nuevo.
- Pendiente solo si algo en la UI o los textos menciona "1960" u otra versión: revisar y corregir.

## 2. Letras que no se usan: seguir la última vez que se usaron y archivarlas

**Problema.** El repertorio crece con letras que se agregaron una vez y nunca volvieron a sonar. Quiero conservar solo
lo que se usa al menos una vez cada ~6 meses.

**Decisión recomendada: archivar, no borrar.** Borrar es irreversible y una canción de Navidad o Semana Santa puede
pasar 11 meses sin usarse y ser necesaria. Archivar logra lo mismo (biblioteca limpia) sin riesgo.

**Cómo funcionaría**

- Cada letra guarda **`lastUsedAt`**: la fecha del último servicio donde estuvo en el plan. Si nunca se usó, cuenta
  desde `createdAt`.
- Umbral por iglesia en Ajustes (3, 4, 6 o 12 meses; por defecto 6).
- Las letras que pasan el umbral aparecen en una lista **"Sugeridas para archivar"** en Letras. Tú confirmas (una
  por una o todas); **nada se archiva solo**.
- **Archivadas** salen de la biblioteca y del diálogo "Agregar al plan", pero se pueden ver en un filtro
  "Archivadas" y **restaurar**. Si quieres, borrar definitivamente es un paso aparte desde ahí.
- En la lista, cada letra muestra "Última vez: hace 2 meses" (usa la zona horaria de la iglesia).
- Opcional: marcar una letra como **"Fija"** para que nunca se sugiera (canciones de temporada).

**Qué toca**

| Repo | Qué |
| --- | --- |
| API / contrato | `Song.lastUsedAt` (calculado desde los servicios), `Song.archivedAt`, filtro `archived` en `GET /songs`, `Church.settings.songArchiveMonths`. El contrato es compartido: se propone aquí y se cambia en su repo, no en esta copia. |
| Web | Columna/etiqueta "Última vez", filtro Archivadas en nuqs, lista de sugeridas, acciones archivar/restaurar con zod, ajuste del umbral. Mock y API en paralelo. |
| iPad | Ocultar archivadas en la biblioteca y al agregar al plan; sincronizar el cambio. |

**Preguntas abiertas**

- ¿"Usada" es que esté en el plan de un servicio pasado, o que de verdad se haya proyectado? (Lo primero es más
  simple y no requiere que la consola reporte nada.)
- ¿La pista de Música asociada también se archiva, o solo la letra?
- ¿Basta con sugerir, o quieres que se archive sola tras el umbral?

**Opción mínima si no quieres complicarte:** solo mostrar "Última vez" y ordenar por ella. Con eso ya ves cuáles
sobran y las borras a mano, sin tocar el contrato más allá de `lastUsedAt`.
