"use client";

// Last-resort boundary when the root layout itself fails. It replaces the whole document.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          background: "#07070B",
          color: "#F6F3EE",
          fontFamily: "system-ui",
          display: "grid",
          placeItems: "center",
          minHeight: "100dvh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1>Algo salió mal</h1>
          <button
            onClick={reset}
            style={{ marginTop: 16, padding: "10px 20px", borderRadius: 999 }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
