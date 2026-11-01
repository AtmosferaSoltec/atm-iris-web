import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { IrisLogo } from "@/components/brand/iris-logo";
import { PageGlow } from "@/components/brand/page-glow";
import { buttonStyles } from "@/components/ui/button";

const NAV = [
  { href: "/#funciones", label: "Funciones" },
  { href: "/#pantallas", label: "Pantallas" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#preguntas", label: "Preguntas" },
];

/** Al llegar con `/#descargar` (o al cambiar de página) lleva la vista a donde corresponde. */
function ScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function PublicLayout() {
  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <ScrollToHash />
      <PageGlow />
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-content items-center gap-8 px-4 sm:px-8">
          <Link to="/" aria-label="Iris, inicio">
            <IrisLogo />
          </Link>
          <nav aria-label="Principal" className="hidden flex-1 items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink-2 transition hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            to="/#descargar"
            className={buttonStyles({ className: "ml-auto h-10 px-5 md:ml-0" })}
          >
            Descargar
          </Link>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-content flex-col gap-6 px-4 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <IrisLogo className="h-6" />
            <p className="text-sm text-ink-2">Que cada palabra ilumine el templo.</p>
          </div>
          <nav aria-label="Legal" className="flex gap-6 text-sm text-ink-2">
            <Link to="/privacidad" className="transition hover:text-ink">
              Privacidad
            </Link>
            <Link to="/terminos" className="transition hover:text-ink">
              Términos
            </Link>
          </nav>
          <div className="flex flex-col gap-2 md:items-end">
            <a
              href="https://atmosferast.com"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 text-sm text-ink-2 transition hover:text-ink"
            >
              Desarrollado por
              <img
                src="/brand/atmosfera-wordmark.svg"
                alt="Atmosfera"
                className="h-5 w-auto opacity-90 transition group-hover:opacity-100"
              />
            </a>
            <p className="text-sm text-ink-2">© {new Date().getFullYear()} Atmosfera</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
