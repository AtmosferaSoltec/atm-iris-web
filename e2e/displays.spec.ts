import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("un televisor se conecta con un código y muestra lo que manda la consola", async ({
  page,
  browser,
}) => {
  // The TV: its own browser, without a session.
  const tvContext = await browser.newContext();
  const tv = await tvContext.newPage();
  await tv.goto("/display");
  const code = tv.getByLabel(/^Código/);
  await expect(code).toHaveText(/^[A-Z2-9]{6}$/);

  await signIn(page);
  await page.goto("/console");
  await page.getByRole("button", { name: "Conectar televisor" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Código").fill((await code.textContent())!.toLowerCase());
  await dialog.getByLabel("Nombre").fill("TV del salón");
  await dialog.getByRole("button", { name: "Conectar televisor" }).click();
  await expect(dialog.getByText("TV del salón")).toBeVisible();
  await expect(dialog.getByText("Conectado", { exact: true })).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("Escape");

  // A song on the screen reaches the TV over the channel.
  await page.getByRole("button", { name: "Agregar «Castillo fuerte» al servicio" }).click();
  await expect(page.getByRole("heading", { name: "Castillo fuerte" })).toBeVisible();
  await page
    .getByRole("button", { name: /Enviar a la pantalla/ })
    .first()
    .click();
  await expect(tv.getByText("Castillo fuerte es nuestro Dios", { exact: false })).toBeVisible();

  // It remembers the link: after a reload it goes straight to the projection.
  await tv.reload();
  await expect(tv.getByText("Castillo fuerte es nuestro Dios", { exact: false })).toBeVisible();

  // Unlinked from the console, it shows a code again.
  await page.getByRole("button", { name: /televisor/ }).click();
  await page.getByRole("button", { name: "Desconectar TV del salón" }).click();
  await expect(tv.getByLabel(/^Código/)).toHaveText(/^[A-Z2-9]{6}$/);

  await page.getByRole("button", { name: "Cerrar", exact: true }).first().click();
  await page.getByRole("button", { name: "Vaciar" }).first().click();
  await page.getByRole("button", { name: "Quitar 1 elemento" }).click();
  await tvContext.close();
});
