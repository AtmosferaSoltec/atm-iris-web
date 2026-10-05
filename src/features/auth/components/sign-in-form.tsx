"use client";

import { Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Banner } from "@/components/ui/banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { idleState } from "@/lib/form-state";
import { signIn } from "../actions";

export function SignInForm({ notice }: { notice?: string }) {
  const [state, action] = useActionState(signIn, idleState);
  const router = useRouter();

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.message ? (
        <Banner tone="error">{state.message}</Banner>
      ) : (
        notice && <Banner tone="success">{notice}</Banner>
      )}
      <TextField
        id="email"
        type="email"
        label="Correo de la iglesia"
        placeholder="nombre@tuiglesia.org"
        autoComplete="email"
        icon={<Mail />}
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <TextField
        id="password"
        type="password"
        label="Contraseña"
        placeholder="Tu contraseña"
        autoComplete="current-password"
        icon={<Lock />}
        error={state.fieldErrors?.password}
        accessory={
          <button
            type="button"
            onClick={(event) => {
              // Carry over what was typed so step 1 starts filled in.
              const field = event.currentTarget.form?.elements.namedItem("email");
              const email = field instanceof HTMLInputElement ? field.value.trim() : "";
              router.push(email ? `/recuperar?email=${encodeURIComponent(email)}` : "/recuperar");
            }}
            className="cursor-pointer text-[13px] font-semibold text-ink-2 hover:text-ink"
          >
            ¿Olvidaste tu contraseña?
          </button>
        }
      />
      <SubmitButton size="lg" className="mt-1 w-full">
        Entrar
      </SubmitButton>
    </form>
  );
}
