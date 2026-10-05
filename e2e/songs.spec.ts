import { expect, test } from "@playwright/test";
import { signIn, toast, unique } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("creates a song and finds it by its lyrics", async ({ page }) => {
  const title = unique("Canción");
  await page.goto("/canciones/nueva");
  await page.locator("#title").fill(title);
  await page.locator("#copyright").fill("Dominio público");
  await page.locator("#lyrics").fill("[Coro]\nGloria en las alturas\n\nSegunda diapositiva");
  await expect(page.getByText("2 diapositivas")).toBeVisible();
  await page.getByRole("button", { name: "Guardar canción" }).click();
  await expect(page).toHaveURL("/canciones");
  await expect(toast(page, "Canción guardada")).toBeVisible();

  await page.locator("#song-search").fill("en las alturas");
  await expect(page).toHaveURL(/search=en\+las\+alturas/);
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  // The search survives a reload.
  await page.reload();
  await expect(page.locator("#song-search")).toHaveValue("en las alturas");
  await expect(page.getByText(title, { exact: true })).toBeVisible();
});

test("imports .txt files and skips the ones already in the library", async ({ page }) => {
  const title = unique("Importada");
  await page.goto("/canciones");
  await page.getByRole("button", { name: "Importar .txt" }).click();
  await page.locator('input[type="file"]').setInputFiles([
    {
      name: `${title}.txt`,
      mimeType: "text/plain",
      buffer: Buffer.from("[Coro]\nAleluya\n\nAmén"),
    },
    { name: "Sublime gracia.txt", mimeType: "text/plain", buffer: Buffer.from("Repetida") },
  ]);
  await expect(page.getByText("Ya está en tu biblioteca")).toBeVisible();
  await page.getByRole("button", { name: "Importar 1 canción" }).click();
  await expect(page.getByText("Se importó 1 canción.").first()).toBeVisible();
  await page.getByRole("button", { name: "Listo" }).click();

  await page.locator("#song-search").fill(title);
  await expect(page.getByText(title, { exact: true })).toBeVisible();
});
