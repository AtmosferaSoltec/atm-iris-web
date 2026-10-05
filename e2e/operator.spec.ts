import { expect, test } from "@playwright/test";
import { OPERATOR, signIn } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page, OPERATOR));

test("an operator doesn't see administration actions", async ({ page }) => {
  await page.goto("/canciones");
  await expect(page.getByRole("heading", { name: "Canciones" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Nueva canción" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Importar .txt" })).toHaveCount(0);

  await page.goto("/servicios");
  await expect(page.getByRole("link", { name: "Nuevo servicio" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Editar / })).toHaveCount(0);
  await page.goto("/servicios/nuevo");
  await expect(page.getByText("No encontramos esta página")).toBeVisible();

  await page.goto("/equipo");
  await expect(page.getByRole("heading", { name: "Equipo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Invitar" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Opciones de / })).toHaveCount(0);
  await expect(page.getByText("Invitaciones pendientes")).toHaveCount(0);

  await page.goto("/multimedia");
  await expect(page.getByRole("button", { name: "Subir archivos" })).toHaveCount(0);

  await page.goto("/tiempos");
  await expect(page.getByRole("button", { name: /Opciones del bloque/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Eliminar registro" })).toHaveCount(0);

  await page.goto("/ajustes");
  await expect(page.getByRole("button", { name: "Guardar" })).toHaveCount(0);

  // But they do manage people: the console adds leaders during the service.
  await page.goto("/personas");
  await expect(page.getByLabel("Nueva persona")).toBeVisible();
});
