import { IrisWordmark } from "@/components/brand/iris-mark";
import { ProjectionShowcase } from "./projection-showcase";

export function AuthHero() {
  return (
    <section className="flex flex-col gap-10">
      <IrisWordmark height={30} />
      <div className="flex flex-col gap-5">
        <p className="w-fit text-accent eyebrow">Proyección para iglesias</p>
        <h1 className="max-w-xl font-serif text-5xl leading-[1.05] font-medium tracking-tight text-balance lg:text-[56px]">
          Que cada palabra <em className="text-accent pr-1">ilumine</em> el templo.
        </h1>
        <p className="max-w-md text-lg text-ink-2">
          Sube las letras, arma tus servicios y organiza tu iglesia desde cualquier navegador.
        </p>
      </div>
      <ProjectionShowcase />
    </section>
  );
}
