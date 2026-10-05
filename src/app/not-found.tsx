import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <EmptyState
        icon={<Compass />}
        title="No encontramos esta página"
        description="Puede que se haya eliminado o que el enlace esté incompleto."
        action={<ButtonLink href="/">Volver al inicio</ButtonLink>}
      />
    </main>
  );
}
