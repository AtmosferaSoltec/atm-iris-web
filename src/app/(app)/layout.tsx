import Link from "next/link";
import { IrisWordmark } from "@/components/brand/iris-mark";
import { AccountMenu } from "@/features/shell/account-menu";
import { AppNav } from "@/features/shell/app-nav";
import { requireSession } from "@/server/dal";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { session, repos } = await requireSession();
  const { modules } = await repos.church.get();

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 z-20 flex flex-col gap-4 border-b border-line bg-canvas/80 px-4 py-3 backdrop-blur-xl lg:h-dvh lg:gap-8 lg:border-r lg:border-b-0 lg:bg-canvas/40 lg:px-4 lg:py-6">
        <div className="flex items-center justify-between gap-4 lg:px-2">
          <Link href="/" aria-label="Inicio">
            <IrisWordmark height={26} />
          </Link>
          <div className="lg:hidden">
            <AccountMenu session={session} compact />
          </div>
        </div>
        <AppNav modules={modules} />
        <div className="mt-auto hidden border-t border-line pt-3 lg:block">
          <AccountMenu session={session} />
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main>
    </div>
  );
}
