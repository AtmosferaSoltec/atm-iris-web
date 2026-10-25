import { expect, test } from "@playwright/test";
import { signIn, toast, unique } from "./helpers";

// Erases every song of the church, the sample ones too, and the mocks keep state for the
// whole run. Playwright runs files alphabetically, so this one is named to go last: the
// tests that need the sample songs ("Castillo fuerte") have already run.

test.beforeEach(async ({ page }) => signIn(page));

test("«Empezar de cero» pide escribir ELIMINAR y borra lo elegido", async ({ page }) => {
  const title = unique("Para borrar");
  await page.goto("/");
  await page.getByRole("button", { name: "Nueva canción" }).click();
  const dialog = page.getByRole("dialog", { name: "Nueva canción" });
  await dialog.locator("#title").fill(title);
  await dialog.locator("#lyrics").fill("Letra");
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(toast(page, "Canción guardada")).toBeVisible();

  await page.goto("/settings");
  const erase = page.getByRole("button", { name: "Eliminar lo elegido" });
  await expect(erase).toBeDisabled();
  await page.getByRole("checkbox", { name: "Eliminar canciones" }).check();
  await erase.click();
  const confirm = page.getByRole("dialog", { name: "¿Eliminar todo lo elegido?" });
  const go = confirm.getByRole("button", { name: "Eliminar todo" });
  await expect(go).toBeDisabled();
  await confirm.getByLabel("Escribe ELIMINAR para confirmar").fill("ELIMINAR");
  await go.click();
  await expect(toast(page, /Se eliminó todo lo elegido/)).toBeVisible();

  await page.goto("/");
  await page.getByLabel("Buscar en la biblioteca").fill(title);
  await expect(page.getByText("Sin resultados.")).toBeVisible();
});
