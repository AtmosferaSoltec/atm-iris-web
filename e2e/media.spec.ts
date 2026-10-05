import { expect, test } from "@playwright/test";
import { pngImage, signIn, toast, unique } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("uploads an image with progress and marks it as background", async ({ page }) => {
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
  await dialog.getByRole("switch", { name: "Usar como fondo en la consola" }).click();
  await expect(toast(page, "Ahora se ofrece como fondo")).toBeVisible();
  await page.keyboard.press("Escape");
  // The chip becomes part of the card's accessible name.
  await expect(page.getByRole("button", { name: `${title}, fondo`, exact: true })).toBeVisible();
});
