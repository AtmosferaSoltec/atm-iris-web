import { Skeleton } from "@/components/ui/skeleton";

/** Shared page skeleton: title, description and two content panels. */
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-content flex-col gap-8" role="status" aria-label="Cargando">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
