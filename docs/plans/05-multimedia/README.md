# 05 · Multimedia

## Objetivo

Contrato §11: biblioteca de imágenes, videos y música. La subida va **del navegador directo al
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

- Encabezado "Multimedia" + "Imágenes, videos y música para proyectar y reproducir en el servicio." + primario "Subir archivos".
- Barra de cuota: "3,2 GB de 5 GB" con `IrisTimeBar`-like (o una barra propia con tokens); en ámbar desde el 80 %, en rojo desde el 95 %.
- `SegmentedControl` en la URL (`kind`): Imágenes · Videos · Música. Búsqueda por título.
- Imágenes y videos: cuadrícula de tarjetas 16:9 (imagen con su `downloadUrl`; video con poster del primer cuadro vía
  `<video preload="metadata">` y duración en cápsula). Música: filas con ícono verde, título, descripción y duración.
- Chip "Fondo" en las imágenes con `isBackground`.
- Clic abre un panel de detalle (`dialog` tamaño `lg`): vista previa (imagen / `<video controls>` / `<audio controls>`),
  título y descripción editables, interruptor "Usar como fondo en la consola" (solo imágenes), datos del archivo
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
