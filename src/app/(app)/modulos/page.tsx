import { permanentRedirect } from "next/navigation";

/** Módulos moved into Ajustes (phase 03); old links still land there. */
export default function ModulesPage() {
  permanentRedirect("/ajustes");
}
