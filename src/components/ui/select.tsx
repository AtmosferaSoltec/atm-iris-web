import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { controlStyles, describedBy, Field } from "./field";

type SelectProps = Omit<ComponentProps<"select">, "id"> & {
  id: string;
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
};

export function Select({
  id,
  label,
  error,
  hint,
  className,
  containerClassName,
  children,
  ...props
}: SelectProps) {
  return (
    <Field id={id} label={label} error={error} hint={hint} className={containerClassName}>
      <div className="relative">
        <select
          id={id}
          name={props.name ?? id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(
            controlStyles(Boolean(error)),
            "h-11 cursor-pointer appearance-none pr-10 pl-4",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-3"
        />
      </div>
    </Field>
  );
}
