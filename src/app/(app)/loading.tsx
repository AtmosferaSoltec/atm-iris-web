import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="grid min-h-[50dvh] place-items-center text-ink-3">
      <Spinner className="size-6" />
    </div>
  );
}
