import { Link } from "react-router";
import { buttonStyles } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-32 text-center">
      <p className="text-accent eyebrow">Error 404</p>
      <h1 className="font-serif text-5xl font-medium">Esta página no existe</h1>
      <Link to="/" className={buttonStyles()}>
        Volver al inicio
      </Link>
    </section>
  );
}
