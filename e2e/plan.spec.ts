import { expect, test } from "@playwright/test";
import { pngImage, signIn, toast, unique } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("agrega, reordena, quita y vacía el plan", async ({ page }) => {
  await page.goto("/plan");
  await expect(page.getByText("El plan está vacío")).toBeVisible();

  // Agregar dos canciones desde el buscador.
  await page.getByRole("button", { name: "Agregar" }).first().click();
  await page.locator("#plan-search").fill("Sublime gracia");
  await page
    .getByRole("listitem")
    .filter({ hasText: "Sublime gracia" })
    .getByRole("button", { name: "Agregar" })
    .click();
  await expect(toast(page, "Se agregó «Sublime gracia» al plan")).toBeVisible();

  await page.locator("#plan-search").fill("Roca de la eternidad");
  await page
    .getByRole("listitem")
    .filter({ hasText: "Roca de la eternidad" })
    .getByRole("button", { name: "Agregar" })
    .click();
  await expect(toast(page, "Se agregó «Roca de la eternidad» al plan")).toBeVisible();

  await page.keyboard.press("Escape");

  // Quedan en el orden en que se agregaron.
  const rows = page.getByRole("list").last().getByRole("listitem");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Sublime gracia");
  await expect(rows.nth(1)).toContainText("Roca de la eternidad");

  // Reordenar: subir el segundo.
  await rows.nth(1).getByRole("button", { name: "Subir" }).click();
  await expect(rows.nth(0)).toContainText("Roca de la eternidad");
  await expect(rows.nth(1)).toContainText("Sublime gracia");

  // Quitar uno.
  await rows
    .nth(1)
    .getByRole("button", { name: /Quitar/ })
    .click();
  await expect(rows).toHaveCount(1);

  // Vaciar todo.
  await page.getByRole("button", { name: "Vaciar" }).click();
  await page.getByRole("button", { name: "Vaciar", exact: true }).last().click();
  await expect(page.getByText("El plan está vacío")).toBeVisible();
});

test("el buscador tiene Letras, Música y Multimedia, y un fondo no aparece en Multimedia", async ({
  page,
}) => {
  const track = unique("Pista");
  const clip = unique("Clip");
  const background = unique("Fondo");

  await page.goto("/musica");
  let chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Subir música" }).click();
  await (
    await chooser
  ).setFiles([{ name: `${track}.mp3`, mimeType: "audio/mpeg", buffer: Buffer.from("ID3 pista") }]);
  await expect(toast(page, `Se subió «${track}»`)).toBeVisible();

  await page.goto("/multimedia");
  chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Subir archivos" }).click();
  await (
    await chooser
  ).setFiles([{ name: `${clip}.png`, mimeType: "image/png", buffer: pngImage(640, 360) }]);
  await expect(toast(page, `Se subió «${clip}»`)).toBeVisible();

  await page.goto("/fondos");
  chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Subir fondos" }).click();
  await (
    await chooser
  ).setFiles([{ name: `${background}.png`, mimeType: "image/png", buffer: pngImage(1920, 1080) }]);
  await expect(toast(page, `Se subió «${background}»`)).toBeVisible();

  await page.goto("/plan");
  await page.getByRole("button", { name: "Agregar" }).first().click();
  await expect(page.getByRole("radio", { name: "Letras" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Música" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Multimedia" })).toBeVisible();

  await page.getByRole("radio", { name: "Música" }).click();
  await page.locator("#plan-search").fill(track);
  await expect(page.getByRole("listitem").filter({ hasText: track })).toBeVisible();

  await page.getByRole("radio", { name: "Multimedia" }).click();
  await page.locator("#plan-search").fill(clip);
  await expect(page.getByRole("listitem").filter({ hasText: clip })).toBeVisible();
  // Un fondo no es multimedia para el plan: se queda en Fondos.
  await page.locator("#plan-search").fill(background);
  await expect(page.getByText("Sin resultados.")).toBeVisible();
});
