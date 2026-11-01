import { LegalPage } from "./legal-page";

export function PrivacyPage() {
  return (
    <LegalPage title="Privacidad">
      <p>
        Iris funciona en tu computadora. No tiene cuentas y no sube tus canciones, archivos ni
        registros de tiempos.
      </p>
      <h2>Qué se comunica por internet</h2>
      <p>
        Al abrirse, Iris consulta nuestro servidor si hay una versión nueva. Esa consulta, como
        cualquier visita web, deja tu dirección IP, la versión de Iris y tu sistema operativo.
      </p>
      <p>
        Si pegas un enlace de YouTube, el reproductor incrustado de YouTube carga recursos de Google
        sujetos a sus propias políticas.
      </p>
      <h2>Tus datos</h2>
      <p>
        Tus datos viven en la carpeta «Iris» de tu equipo y tú decides cuándo copiarlos o borrarlos.
      </p>
    </LegalPage>
  );
}
