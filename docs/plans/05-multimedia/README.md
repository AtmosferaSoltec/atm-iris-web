# 05 · Multimedia

## Objetivo

Contrato §11: biblioteca de multimedia (imágenes, videos u otros archivos) para presentar en una ocasión especial; no es un repertorio. La música de uso recurrente la leen las apps del iPad y de Windows desde una carpeta local, no se sube a la web. La subida va **del navegador directo al
almacenamiento** con la URL firmada (los archivos no pasan por Next ni por la API), con progreso,
metadatos medidos en el navegador y cuota visible.

## Dependencias

Fases 00 y 03. Solo visible con el módulo `multimedia` encendido.

## Repositorio

`MediaRepository`: `list({ kind, search, isBackground, page, limit })`, `get(id)`, `createUpload(input)` → `UploadTicket`,
`confirm(input)` → `MediaAsset`, `update(id, patch)`, `delete(id)`, `downloadUrl(id)` → `{ url, expiresAt }`.
El mock corre en el servidor, así que simula el almacenamiento con un route handler local: devuelve un `uploadUrl`
hacia `src/app/api/mock-storage/[id]/route.ts` que acepta el PUT y guarda los bytes en memoria,
y `downloadUrl` hacia ese mismo handler con GET. Ese route handler solo existe con `DATA_SOURCE=mock` (si no, 404).

## Flujo de subida (cliente)

`src/features/media/upload/` — un hook `useMediaUpload()` y una cola visual:

1. El usuario arrastra o elige archivos (multiples). Por cada uno, en el navegador:
   - deduce `kind` por `type`; rechaza localmente los tipos y tamaños fuera de la tabla del contrato con el mismo mensaje del API;
   - mide metadatos: imagen → `width`/`height` con `createImageBitmap`; video → `duration`, `videoWidth`, `videoHeight` con un
     `<video preload="metadata">`; audio → `duration` con un `<audio>`. Redondea `durationSeconds` a entero.
2. Server Action `requestUpload` → `UploadTicket`.
3. `XMLHttpRequest` `PUT uploadUrl` con los `headers` del ticket, mostrando el progreso (`upload.onprogress`). Permite cancelar.
4. Server Action `confirmUpload({ uploadId, title (nombre sin extensión), durationSeconds, width, height, isBackground })`.
5. `revalidatePath("/multimedia")` y toast.
   Errores por archivo (no tiran la cola completa): `STORAGE_QUOTA_EXCEEDED`, `UNSUPPORTED_MEDIA_TYPE`, `FILE_TOO_LARGE`,
   falla de red en el PUT ("No se pudo subir. Reintentar").

## Pantalla `/multimedia`

- Encabezado "Multimedia" + "Imágenes, videos o cualquier archivo para presentar en una ocasión especial…" + primario "Subir archivos".
- Barra de cuota: "3,2 GB de 5 GB" con `IrisTimeBar`-like (o una barra propia con tokens); en ámbar desde el 80 %, en rojo desde el 95 %.
- Una sola lista, sin separar por tipo (la URL solo lleva `search` y `page`; `kind` queda como dato interno del contrato).
  Búsqueda por título.
- Cuadrícula de tarjetas 16:9: imagen con su `downloadUrl`; video con poster del primer cuadro vía
  `<video preload="metadata">` y duración en cápsula; audio con ícono y duración.
- Los fondos de las letras no aparecen aquí: tienen su pantalla `/fondos` (la lista pide `isBackground: false`).
- Clic abre un panel de detalle (`dialog` tamaño `lg`): vista previa (imagen / `<video controls>` / `<audio controls>`),
  título y descripción editables, datos del archivo
  ("JPG · 1920 × 1080 · 2,4 MB"), "Eliminar" (confirmación: "Se quitará de la biblioteca y de las consolas.").
- Las URLs de descarga caducan en 1 h: pídelas al renderizar la página (en paralelo, máximo 20 por página) y usa `<img>`
  normal (no `next/image`), con `loading="lazy"`.
- Sin `media.manage`: sin subir, editar ni borrar.
- Panel de almacenamiento de `/ajustes` (fase 03) pasa a mostrar la cuota real.

## Criterios de aceptación

- Con mocks: subir varios archivos con progreso, verlos, editarlos, marcarlos como fondo y borrarlos.
- Compila, lint, tipos, build.

## Desviaciones

- **Textos de error**: el contrato no fija los mensajes de `UNSUPPORTED_MEDIA_TYPE`, `FILE_TOO_LARGE`,
  `STORAGE_QUOTA_EXCEEDED` ni `UPLOAD_NOT_FOUND`. Los de la web y el mock están en `src/domain/media-rules.ts`;
  con el API real se muestran los suyos (el rechazo local, antes de pedir el ticket, usa los de la web).
- **Almacenamiento simulado**: `src/app/api/mock-storage/[key]/route.ts` (`PUT` y `GET` con `Range`, para poder
  adelantar videos). La URL que entrega el mock es relativa (`/api/mock-storage/<id>`); la del API es absoluta.
- **Varios archivos a la vez** se suben en paralelo; las Server Actions de Next se ejecutan de a una, pero los
  `PUT` al almacenamiento sí van en paralelo.
- **Miniaturas de video**: el primer cuadro con `<video preload="metadata" src="…#t=0.1">`, porque el contrato no
  guarda pósters.
- **Módulo apagado**: `/multimedia` responde "no encontrado" y desaparece de la navegación.
- Arrastrar archivos funciona sobre toda la página (resalta la biblioteca); el atajo `/` enfoca la búsqueda.

## Fondos (`/fondos`)

Imágenes y videos que las consolas muestran **detrás de la letra** (medios con `isBackground: true`, contrato §11).
Entrada propia en la navegación, junto a Multimedia, y solo visible con el módulo `multimedia` encendido.

- Encabezado "Fondos" + "Subir fondos", panel con los requisitos y la barra de cuota, la misma cola de subida y una
  cuadrícula 16:9. Los videos se previsualizan en bucle y sin sonido; clic abre el panel de detalle (renombrar, eliminar).
- Reglas (`BACKGROUND_RULES` en `src/domain/media-rules.ts`; el API tiene la misma tabla):

  | | Imagen | Video |
  |---|---|---|
  | Formato | JPG, PNG, WebP | solo MP4 |
  | Proporción | 16:9 (±2 %) | 16:9 (±2 %) |
  | Tamaño | 1280 × 720 – 3840 × 2160 (recomendado 1920 × 1080) | 1280 × 720 – 1920 × 1080 |
  | Duración | — | hasta 30 s, en bucle y sin sonido |
  | Peso | 10 MB | 100 MB |

- **Por qué 30 s**: el video se repite sin parar detrás de la letra; un clip corto pesa poco (cabe en la caché de las
  consolas sin conexión) y el salto del bucle se nota menos si se diseña para repetirse. Un audio no puede ser fondo.
- `useMediaUpload({ background: true })` mide el archivo y aplica `backgroundProblem` antes de pedir el ticket, con el
  mismo mensaje que da el API (400 `VALIDATION_FAILED`); el mock hace lo mismo al confirmar.
