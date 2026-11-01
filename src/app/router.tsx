import { createBrowserRouter } from "react-router";
import { PublicLayout } from "@/layouts/public-layout";
import { LandingPage } from "@/features/landing/landing-page";
import { NotFoundPage } from "@/features/legal/not-found-page";
import { PrivacyPage } from "@/features/legal/privacy-page";
import { TermsPage } from "@/features/legal/terms-page";

/**
 * Mapa del sitio. Hoy solo hay páginas públicas.
 *
 * Cuando llegue la web con cuenta (login, inicio, tiempos, reportes) se agrega, sin tocar lo de
 * arriba, un segundo grupo:
 *   { path: 'login', … }                       dentro de AuthLayout (pantalla de acceso)
 *   { path: 'app', Component: AppLayout, children: [ inicio, tiempos, reportes … ] }
 * AppLayout comprueba la sesión y redirige a /login; la landing sigue siendo pública en '/'.
 */
export const router = createBrowserRouter([
  {
    Component: PublicLayout,
    children: [
      { index: true, Component: LandingPage },
      { path: "privacidad", Component: PrivacyPage },
      { path: "terminos", Component: TermsPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
