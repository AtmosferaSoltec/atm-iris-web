import { expect, test } from "@playwright/test";
import { signIn, toast } from "./helpers";

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
