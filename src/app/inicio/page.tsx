import type { Metadata } from "next";
import { LandingHeader } from "@/features/landing/components/landing-header";
import {
  LandingApps,
  LandingCta,
  LandingFeatures,
  LandingFooter,
  LandingHero,
  LandingHowItWorks,
} from "@/features/landing/components/landing-content";

// Public page. Visitors without a session see it at "/" (src/proxy.ts rewrites "/" here).
export const metadata: Metadata = {
  title: { absolute: "Iris · Proyección para iglesias" },
  description:
    "Iris reúne las letras, la música y la multimedia de tu iglesia y las proyecta en la pantalla del templo mientras diriges el servicio.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Iris · Proyección para iglesias",
    description:
      "Letras, música y multimedia en la pantalla del templo. Tú diriges todo desde el iPad o Windows.",
    type: "website",
    locale: "es_PE",
  },
};

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingApps />
        <LandingCta />
      </main>
      <LandingFooter />
    </>
  );
}
