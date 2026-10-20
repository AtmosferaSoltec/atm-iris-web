import { expect, test, type Page } from "@playwright/test";
import { addToService, pngImage, signIn, toast, unique } from "./helpers";

// Songs are made, edited and deleted in the console's library (BIBLIOTECA).

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await page.goto("/");
});

const library = (page: Page) => page.getByRole("list").first();

async function newSong(page: Page, title: string, lyrics: string) {
  await page.getByRole("button", { name: "Nueva canción" }).click();
  const dialog = page.getByRole("dialog", { name: "Nueva canción" });
  await dialog.locator("#title").fill(title);
  await dialog.locator("#lyrics").fill(lyrics);
  await dialog.getByRole("button", { name: "Guardar canción" }).click();
  await expect(toast(page, "Canción guardada")).toBeVisible();
  await expect(dialog).toBeHidden();
}

test("crea, edita y elimina una canción sin salir de la consola", async ({ page }) => {
  const title = unique("Cuán grande es Él");
  await newSong(page, title, "Señor mi Dios\nal contemplar los cielos\n\n#Coro\nCuán grande es Él");

  // It shows up in the library right away, and can go into the service.
  await page.getByLabel("Buscar en la biblioteca").fill(title);
  await expect(library(page).getByText(title, { exact: true })).toBeVisible();
  await addToService(page, title);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  // Edited: the service shows the new slides.
  await page.getByRole("button", { name: `Opciones de «${title}»` }).click();
  await page.getByRole("menuitem", { name: "Editar canción" }).click();
  const dialog = page.getByRole("dialog", { name: title });
  await expect(dialog.locator("#lyrics")).toHaveValue(/al contemplar los cielos/);
  await dialog.locator("#lyrics").fill("Una sola diapositiva nueva");
  await dialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(toast(page, "Canción guardada")).toBeVisible();
  await expect(page.getByText("Una sola diapositiva nueva").first()).toBeVisible();

  // Deleted: gone from the library and from the service.
  await page.getByRole("button", { name: `Opciones de «${title}»` }).click();
  await page.getByRole("menuitem", { name: "Eliminar" }).click();
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await expect(toast(page, `Se eliminó «${title}»`)).toBeVisible();
  await expect(page.getByText(title)).toHaveCount(1); // only the toast
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
});

test("una canción necesita letra o pista, y conserva la pista que se le dio", async ({ page }) => {
  const title = unique("Con pista");
  await page.getByRole("button", { name: "Nueva canción" }).click();
  const dialog = page.getByRole("dialog", { name: "Nueva canción" });
  await dialog.locator("#title").fill(title);
  await dialog.getByRole("button", { name: "Guardar canción" }).click();
  await expect(dialog.getByText("Pega la letra o elige una pista", { exact: false })).toBeVisible();

  const chooser = page.waitForEvent("filechooser");
  await dialog.getByRole("button", { name: "O sube un MP3" }).click();
  await (
    await chooser
  ).setFiles({ name: "hoy-te-salvo.mp3", mimeType: "audio/mpeg", buffer: Buffer.from("ID3 a") });
  await expect(toast(page, /Pista lista/)).toBeVisible();
  await expect(dialog.getByText("hoy-te-salvo.mp3")).toBeVisible();
  await dialog.getByRole("button", { name: "Guardar canción" }).click();
  await expect(toast(page, "Canción guardada")).toBeVisible();

  await page.getByLabel("Buscar en la biblioteca").fill(title);
  await expect(library(page).getByText("Solo pista", { exact: false })).toBeVisible();
});

test("las páginas de antes llevan a la consola", async ({ page }) => {
  for (const path of ["/songs", "/songs/new", "/media", "/canciones", "/multimedia"]) {
    await page.goto(path);
    await expect(page).toHaveURL("/");
  }
});

test("archivar saca la canción de la biblioteca y se restaura desde «Archivadas»", async ({
  page,
}) => {
  const title = unique("Canción para archivar");
  await newSong(page, title, "Una letra que se conserva");
  await page.getByLabel("Buscar en la biblioteca").fill(title);

  await page.getByRole("button", { name: `Opciones de «${title}»` }).click();
  await page.getByRole("menuitem", { name: "Archivar" }).click();
  await expect(toast(page, `«${title}» se archivó`)).toBeVisible();
  await expect(library(page).getByText(title, { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Archivadas" }).click();
  await expect(library(page).getByText(title, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Restaurar" }).click();
  await expect(toast(page, `«${title}» volvió a la biblioteca`)).toBeVisible();

  await page.getByRole("button", { name: "Volver a la biblioteca" }).click();
  await expect(library(page).getByText(title, { exact: true })).toBeVisible();
});

test("cada canción puede tener su fondo, que se guarda desde el selector de fondos", async ({
  page,
}) => {
  const background = unique("Fondo de canción");
  const title = unique("Canción con fondo");
  await newSong(page, title, "Letra con fondo");

  // A background is uploaded from the picker.
  await page.getByRole("button", { name: "Fondo", exact: true }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Agregar fondo" }).click();
  await (
    await chooser
  ).setFiles([{ name: `${background}.png`, mimeType: "image/png", buffer: pngImage(640, 360) }]);
  await expect(toast(page, `Fondo «${background}» listo`)).toBeVisible();
  await page.keyboard.press("Escape");

  // The song's editor offers it as the song's own.
  await page.getByLabel("Buscar en la biblioteca").fill(title);
  await page.getByRole("button", { name: `Opciones de «${title}»` }).click();
  await page.getByRole("menuitem", { name: "Editar canción" }).click();
  const dialog = page.getByRole("dialog", { name: title });
  await dialog.getByRole("button", { name: background, exact: true }).click();
  await dialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(toast(page, "Canción guardada")).toBeVisible();

  // Reopened, it is still the chosen one.
  await page.getByRole("button", { name: `Opciones de «${title}»` }).click();
  await page.getByRole("menuitem", { name: "Editar canción" }).click();
  await expect(
    page
      .getByRole("dialog", { name: title })
      .getByRole("button", { name: background, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
