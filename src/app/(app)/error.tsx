"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Surface } from "@/components/ui/surface";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Surface className="mx-auto max-w-settings">
      <EmptyState
        icon={<TriangleAlert />}
        title="No pudimos cargar esta página"
        description="Algo salió mal. Inténtalo de nuevo."
        action={<Button onClick={reset}>Reintentar</Button>}
      />
    </Surface>
  );
}
