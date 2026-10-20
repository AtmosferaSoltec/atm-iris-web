import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("la consola manda la letra y el fondo a la pantalla abierta en otra ventana", async ({
  page,
  context,
}) => {
  const screen = await context.newPage();
  await screen.goto("/display");
  await expect(screen.getByText("Esperando la consola", { exact: false })).toBeVisible();

  await page.goto("/console");
  await expect(page.getByText("Pantalla conectada")).toBeVisible();

  // The service is the plan: adding a song here adds it there too.
  await page.getByRole("button", { name: "Agregar «Castillo fuerte» al servicio" }).click();
  await expect(page.getByRole("heading", { name: "Castillo fuerte" })).toBeVisible();

  await page
    .getByRole("button", { name: /Enviar a la pantalla/ })
    .first()
    .click();
  await expect(screen.getByText("Castillo fuerte es nuestro Dios", { exact: false })).toBeVisible();

  // B clears the screen: only the background stays.
  await page.keyboard.press("b");
  await expect(screen.getByText("Castillo fuerte es nuestro Dios", { exact: false })).toHaveCount(
    0,
  );
  await page.keyboard.press("b");
  await expect(screen.getByText("Castillo fuerte es nuestro Dios", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Cambiar fondo" }).click();
  await page.getByRole("button", { name: "Océano" }).click();
  await expect(page.getByRole("button", { name: "Océano" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // The service is the plan: it is still there after a reload, and "Vaciar" empties it.
  await page.reload();
  await expect(page.getByText("Castillo fuerte", { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "Vaciar" }).first().click();
  await page.getByRole("button", { name: "Quitar 1 elemento" }).click();
  await page.reload();
  await expect(page.getByText("Castillo fuerte", { exact: false })).toHaveCount(1);
});
