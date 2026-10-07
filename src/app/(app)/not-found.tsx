import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Surface } from "@/components/ui/surface";

/** Missing resources and pages the role can't use, inside the app shell. */
export default function AppNotFound() {
  return (
    <Surface className="mx-auto max-w-settings">
      <EmptyState
        icon={<Compass />}
        title="No encontramos esta página"
        description="Puede que se haya eliminado o que el enlace esté incompleto."
        action={<ButtonLink href="/">Volver al inicio</ButtonLink>}
      />
    </Surface>
  );
}
