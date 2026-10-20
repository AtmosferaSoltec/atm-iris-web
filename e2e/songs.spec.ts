import { expect, test, type Page } from "@playwright/test";
import { addToService, signIn, toast, unique } from "./helpers";

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
