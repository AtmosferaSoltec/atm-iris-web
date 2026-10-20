import { expect, test } from "@playwright/test";
import { pngImage, signIn, toast, unique } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("sube una imagen desde la consola, la abre y la elimina", async ({ page }) => {
  const title = unique("Amanecer");
  await page.goto("/");
  await page.getByRole("radio", { name: "Multimedia" }).click();
  // Through the button, like a person: it only opens the picker once the page is interactive.
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Subir imágenes" }).click();
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
  await expect(page.getByRole("button", { name: `Agregar «${title}» al servicio` })).toBeVisible();

  await page.getByRole("button", { name: `Opciones de «${title}»` }).click();
  await page.getByRole("menuitem", { name: "Ver y editar" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("PNG · 640 × 360", { exact: false })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: `Opciones de «${title}»` }).click();
  await page.getByRole("menuitem", { name: "Eliminar" }).click();
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await expect(toast(page, `Se eliminó «${title}»`)).toBeVisible();
  await expect(page.getByRole("button", { name: `Agregar «${title}» al servicio` })).toHaveCount(0);
});

test("fondos: se suben desde la consola, de cualquier tamaño, y se eligen", async ({ page }) => {
  const title = unique("Fondo");
  await page.goto("/");
  await page.getByRole("button", { name: "Fondo" }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Agregar fondo" }).click();
  await (
    await chooser
  ).setFiles([
    // Square and small: it fills the screen, cropped.
    { name: `${title}.png`, mimeType: "image/png", buffer: pngImage(640, 640) },
    { name: "animado.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a") },
  ]);
  await expect(toast(page, `Fondo «${title}» listo`)).toBeVisible();
  await expect(page.getByText("animado: ", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: title, exact: true }).click();
  await expect(page.getByRole("button", { name: title, exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Not in the console's multimedia, and deleted from the picker.
  await page.getByRole("button", { name: `Eliminar el fondo ${title}` }).click();
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await expect(page.getByRole("button", { name: title, exact: true })).toHaveCount(0);
});

test("multimedia se separa en imágenes, videos y YouTube", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "Multimedia" }).click();

  // One tab per kind, and each has its own button and its own empty state.
  const kinds = page.getByRole("radiogroup", { name: "Tipo de multimedia" });
  await expect(kinds.getByRole("radio", { name: "Imágenes" })).toBeChecked();
  await expect(page.getByRole("button", { name: "Subir imágenes" })).toBeVisible();

  await kinds.getByRole("radio", { name: "Videos" }).click();
  await expect(page.getByRole("button", { name: "Subir videos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Subir imágenes" })).toHaveCount(0);

  await kinds.getByRole("radio", { name: "YouTube" }).click();
  await expect(page.getByText("Aún no hay enlaces de YouTube", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Agregar enlace de YouTube" }).click();
  const dialog = page.getByRole("dialog", { name: "Video de YouTube" });
  await dialog.getByLabel("Enlace").fill("https://example.com/no-es-youtube");
  await expect(dialog.getByText("Ese enlace no es de un video de YouTube.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Guardar en la biblioteca" })).toBeDisabled();
});
