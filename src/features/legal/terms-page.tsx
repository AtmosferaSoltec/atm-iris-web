import { LegalPage } from "./legal-page";

export function TermsPage() {
  return (
    <LegalPage title="Términos de uso">
      <p>Estos términos son un borrador y se completarán antes del lanzamiento público.</p>
      <h2>Uso</h2>
      <p>
        Iris se ofrece tal como está. Eres responsable del contenido que proyectas y de contar con
        los derechos de las letras, audios y videos que uses.
      </p>
      <h2>Actualizaciones</h2>
      <p>
        Para mantener a todos en la misma versión, Iris exige instalar las versiones nuevas cuando
        estén disponibles.
      </p>
    </LegalPage>
  );
}
