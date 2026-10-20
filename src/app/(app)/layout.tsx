import { IrisWordmark } from "@/components/brand/iris-mark";
import { BackLink } from "@/components/ui/back-link";
import { requireSession } from "@/server/dal";

/** Times and settings: secondary pages. The console ("/") is the app; these lead back to it. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireSession();

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-8 lg:px-12">
        <BackLink href="/">Volver al servicio</BackLink>
        <IrisWordmark height={24} />
      </header>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main>
    </div>
  );
}
