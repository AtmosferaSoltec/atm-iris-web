import { expect, test } from "@playwright/test";
import { pngImage, signIn, toast, unique } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("uploads an image with progress and lists it in the library", async ({ page }) => {
  const title = unique("Amanecer");
  await page.goto("/multimedia");
  // Through the button, like a person: it only opens the picker once the page is interactive.
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Subir archivos" }).click();
  await (
    await chooser
  ).setFiles([
    { name: `${title}.png`, mimeType: "image/png", buffer: pngImage(640, 360) },
    { name: "animado.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a") },
  ]);

  const queue = page.getByRole("region", { name: "Subidas" });
  await expect(
    queue.getByText("Ese tipo de archivo no se puede subir", { exact: false }),
  ).toBeVisible();
  await expect(toast(page, `Se subió «${title}»`)).toBeVisible();
  await expect(queue.getByText("Listo")).toBeVisible();

  await page.getByRole("button", { name: title, exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("PNG · 640 × 360", { exact: false })).toBeVisible();
  await page.keyboard.press("Escape");
});

test("backgrounds: accepts 1920 x 1080 and explains why it rejects the rest", async ({ page }) => {
  const title = unique("Fondo");
  await page.goto("/fondos");
  await expect(page.getByText("Hasta 30 segundos")).toBeVisible();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Subir fondos" }).click();
  await (
    await chooser
  ).setFiles([
    { name: `${title}.png`, mimeType: "image/png", buffer: pngImage(1920, 1080) },
    { name: "chico.png", mimeType: "image/png", buffer: pngImage(640, 360) },
    { name: "cuadrado.png", mimeType: "image/png", buffer: pngImage(1080, 1080) },
  ]);

  const queue = page.getByRole("region", { name: "Subidas" });
  await expect(toast(page, `Se subió «${title}»`)).toBeVisible();
  await expect(queue.getByText("entre 1280 × 720", { exact: false })).toBeVisible();
  await expect(queue.getByText("16:9", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: title, exact: true })).toBeVisible();

  // Backgrounds live in their own section, not in the multimedia library.
  await page.goto("/multimedia");
  await expect(page.getByRole("button", { name: title, exact: true })).toHaveCount(0);
});
