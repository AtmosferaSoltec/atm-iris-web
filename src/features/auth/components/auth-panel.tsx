"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Surface } from "@/components/ui/surface";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

type Mode = "signIn" | "signUp";

const COPY: Record<Mode, { title: string; subtitle: string }> = {
  signIn: {
    title: "Te damos la bienvenida",
    subtitle: "Ingresa con el correo de tu iglesia para preparar el servicio.",
  },
  signUp: {
    title: "Crea el espacio de tu iglesia",
    subtitle: "Configúralo en menos de un minuto y empieza a proyectar.",
  },
};

/** `notice`: a success message to show above the sign-in form (e.g. after a reset). */
export function AuthPanel({ notice }: { notice?: string }) {
  const [mode, setMode] = useState<Mode>("signIn");

  return (
    <Surface className="w-full max-w-[480px] rounded-2xl p-8 sm:p-10">
      <div key={mode} className="animate-fade-in">
        <h2 className="font-serif text-[28px] font-medium tracking-tight">{COPY[mode].title}</h2>
        <p className="mt-2 text-[15px] text-ink-2">{COPY[mode].subtitle}</p>
      </div>
      <SegmentedControl
        label="Modo de acceso"
        className="my-7"
        value={mode}
        onChange={setMode}
        options={[
          { value: "signIn", label: "Iniciar sesión" },
          { value: "signUp", label: "Crear cuenta" },
        ]}
      />
      {mode === "signIn" ? <SignInForm notice={notice} /> : <SignUpForm />}
    </Surface>
  );
}
