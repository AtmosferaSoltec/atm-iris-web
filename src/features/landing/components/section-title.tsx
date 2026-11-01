export function SectionTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      <p className="text-accent eyebrow">{eyebrow}</p>
      <h2 className="font-serif text-4xl leading-tight font-medium tracking-tight text-balance sm:text-5xl">
        {title}
      </h2>
      {text && <p className="text-lg text-ink-2">{text}</p>}
    </div>
  );
}
