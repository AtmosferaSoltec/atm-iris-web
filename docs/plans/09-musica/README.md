# Fase 09 · Música en la nube

**Estado: hecha.** Afecta a la API, la web y el iPad. Windows lo hace otro agente leyendo el contrato.

## Por qué

Las consolas leían la música de una carpeta local ("Música" en el iPad, una carpeta en Windows). Cada pista nueva
había que copiarla a mano a cada equipo (USB → Mac → iPad, y otra vez para Windows). Ahora la música se sube una sola vez
desde la web, vive en el almacenamiento (R2) y cada consola descarga solo lo que usa.

## Decisiones

- **Tres secciones de archivos**, el mismo `MediaAsset` del contrato §11:
  - **Música** (`/musica`): `kind=audio`, el repertorio de pistas que suenan en el salón. Separada de las letras.
  - **Fondos** (`/fondos`): `isBackground=true`.
  - **Multimedia** (`/multimedia`): `kind=image,video&isBackground=false`, material para una ocasión.
  - Las tres dependen del módulo Multimedia, como antes.
- **"Canciones" pasa a llamarse "Letras"** (`/letras`; `/canciones/*` redirige con 308). El código sigue diciendo
  `songs`, igual que el contrato.
- **Una sola cuota por iglesia** (5 GiB en el plan Gratis) que comparten las tres secciones. `Church.storage.breakdown`
  (contrato §6) dice cuánto ocupa cada una; Ajustes lo muestra en una barra dividida.
- **Las consolas descargan bajo demanda** (contrato §11): imágenes y fondos apenas sincronizan; música y videos al
  agregarlos a un servicio, y quedan guardados. Lo borrado en la web se elimina en la siguiente sincronización.
  Se descarta reproducir por internet: si la red falla a mitad de una canción, se corta en pleno servicio.
- La sincronización sin conexión de letras, servicios y Biblia se queda como estaba.

## Cambios

| Repo | Qué |
| --- | --- |
| API | `GET /media?kind=image,video` (varios tipos); `Church.storage.breakdown` (`musicBytes`, `backgroundBytes`, `mediaBytes`). |
| Contrato | §6 `StorageUsage`; §11 secciones y qué descarga cada consola y cuándo. Copiado a web e iOS; **falta copiarlo a Windows**. |
| Web | Sección Música (subida múltiple, escuchar en la lista, editar y borrar con el mismo diálogo), Letras, Multimedia sin audio, uploads que solo aceptan los tipos de su sección, contador por sección en Ajustes. |
| iPad | Sin carpeta local (se quitó `LocalMusicFolder` y el acceso desde Archivos; la carpeta vieja se borra al abrir). Pestaña Música con los audios de la nube. Música y videos se pueden agregar sin descargar: la consola muestra "Descargando…" y habilita Reproducir cuando el archivo llega. |

## Desviaciones

- El iPad no muestra el uso de almacenamiento: el contador vive en Ajustes de la web. El DTO ya decodifica `breakdown`.
