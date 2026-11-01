import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { queryClient } from "./query-client";
import { router } from "./router";

/** Proveedores globales. Cuando llegue la cuenta, aquí se agrega el proveedor de sesión. */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
