import { greeting, longDateOverline } from "@/lib/format";

/** Date and greeting by the church's clock, not the browser's or the server's. */
export function Greeting({
  churchName,
  timeZone,
  now,
}: {
  churchName: string;
  timeZone: string;
  now: Date;
}) {
  return (
    <header className="flex flex-col gap-3">
      <p className="w-fit text-accent eyebrow">{longDateOverline(now, timeZone)}</p>
      <h1 className="font-serif text-4xl leading-tight font-medium tracking-tight sm:text-[44px]">
        {greeting(now, timeZone)}
        <br />
        <span className="text-accent">{churchName}</span>
      </h1>
      <p className="text-[15px] text-ink-2">
        Prepara las letras, los servicios y los equipos de esta semana.
      </p>
    </header>
  );
}
