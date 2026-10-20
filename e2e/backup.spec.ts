import { expect, test } from "@playwright/test";
import { signIn, toast, unique } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("el respaldo se descarga y se importa; lo repetido se omite", async ({ page }) => {
  await page.goto("/settings");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar respaldo" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^iris-respaldo-.*\.json$/);
  const path = await file.path();

  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Importar respaldo" }).click();
  await (await chooser).setFiles(path);
  await expect(toast(page, /Se importaron 0 canciones/)).toBeVisible();

  // Something that is not a backup says so.
  const wrong = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Importar respaldo" }).click();
  await (
    await wrong
  ).setFiles({ name: "otra-cosa.json", mimeType: "application/json", buffer: Buffer.from("{}") });
  await expect(page.getByText("Ese archivo no es un respaldo de Iris.")).toBeVisible();
});

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
