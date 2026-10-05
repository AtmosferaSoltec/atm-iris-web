"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Banner } from "@/components/ui/banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { idleState } from "@/lib/form-state";
import { resendResetCode, verifyResetCode } from "../../actions";

/** Matches the API's 3-per-hour limit loosely; mainly stops double clicks. */
const RESEND_COOLDOWN_SECONDS = 60;

export function CodeStepForm() {
  const [state, action] = useActionState(verifyResetCode, idleState);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resendResult, setResendResult] = useState<{ tone: "success" | "error"; text: string }>();
  const [isResending, startResend] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function resend() {
    startResend(async () => {
      const result = await resendResetCode();
      setResendResult(
        result.error
          ? { tone: "error", text: result.error }
          : { tone: "success", text: "Te enviamos un código nuevo. El anterior ya no sirve." },
      );
      setCooldown(RESEND_COOLDOWN_SECONDS);
    });
  }

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.message && <Banner tone="error">{state.message}</Banner>}
      {resendResult && !state.message && (
        <Banner tone={resendResult.tone}>{resendResult.text}</Banner>
      )}
      <TextField
        id="code"
        label="Código de 6 dígitos"
        placeholder="000000"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        pattern="\d{6}"
        defaultValue={state.values?.code}
        error={state.fieldErrors?.code}
        className="h-14 text-center font-mono text-2xl tracking-[0.5em] tabular-nums"
        autoFocus
      />
      <SubmitButton size="lg" className="w-full">
        Continuar
      </SubmitButton>
      <p className="text-center text-sm text-ink-3">
        ¿No te llegó?{" "}
        {cooldown > 0 ? (
          <span className="tabular-nums">Puedes pedir otro en {cooldown} s.</span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={isResending}
            className="cursor-pointer font-semibold text-ink-2 hover:text-ink disabled:opacity-50"
          >
            Reenviar código
          </button>
        )}
      </p>
    </form>
  );
}
