import { DownloadSection } from "./components/download";
import { Faq } from "./components/faq";
import { Features } from "./components/features";
import { Hero } from "./components/hero";
import { HowItWorks } from "./components/how-it-works";
import { Screens } from "./components/screens";

export function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Screens />
      <HowItWorks />
      <DownloadSection />
      <Faq />
    </>
  );
}
