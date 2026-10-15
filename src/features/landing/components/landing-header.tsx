import Link from "next/link";
import { IrisWordmark } from "@/components/brand/iris-mark";
import { buttonStyles } from "@/components/ui/button";

const LINKS = [
  { href: "#que-es", label: "Qué es" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#apps", label: "Apps" },
];

/** Landing top bar: brand, section anchors and the way in for people who already have an account. */
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" aria-label="Iris, inicio">
          <IrisWordmark height={26} />
        </Link>

        <nav aria-label="Secciones" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-2 transition hover:bg-surface hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={buttonStyles({
              variant: "ghost",
              size: "sm",
              className: "hidden sm:inline-flex",
            })}
          >
            ¿Ya tienes cuenta?
          </Link>
          <Link href="/login" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  );
}
