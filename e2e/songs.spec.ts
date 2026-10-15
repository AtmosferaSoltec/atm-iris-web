import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { signIn, toast, unique } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("creates a song and finds it by its lyrics", async ({ page }) => {
  const title = unique("Letra");
  await page.goto("/letras/nueva");
  await page.locator("#title").fill(title);
  await page.locator("#lyrics").fill("#Coro\nGloria en las alturas\n\nSegunda diapositiva");
  await expect(page.getByText("2 diapositivas")).toBeVisible();
  await expect(page.getByText("Coro", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Guardar letra" }).click();
  await expect(page).toHaveURL("/letras");
  await expect(toast(page, "Letra guardada")).toBeVisible();

  await page.locator("#song-search").fill("en las alturas");
  await expect(page).toHaveURL(/search=en\+las\+alturas/);
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  // The search survives a reload.
  await page.reload();
  await expect(page.locator("#song-search")).toHaveValue("en las alturas");
  await expect(page.getByText(title, { exact: true })).toBeVisible();
});

test("exporta las letras y las vuelve a importar en otra cuenta", async ({ page }) => {
  const title = unique("Letra para exportar");
  await page.goto("/letras/nueva");
  await page.locator("#title").fill(title);
  await page.locator("#lyrics").fill("Primera diapositiva");
  await page.getByRole("button", { name: "Guardar letra" }).click();
  await expect(page).toHaveURL("/letras");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar" }).click();
  const download = await downloadPromise;
  await expect(toast(page, /Se exportó/)).toBeVisible();
  const path = await download.path();
  const exported = JSON.parse(await readFile(path!, "utf-8")) as {
    songs: { title: string }[];
  };
  expect(exported.songs.some((song) => song.title === title)).toBe(true);

  const importedTitle = unique("Letra importada");
  const payload = Buffer.from(
    JSON.stringify({
      songs: [
        {
          title: importedTitle,
          author: "Autor importado",
          sections: [{ label: null, text: "Hola" }],
        },
      ],
    }),
  );
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Importar" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: "letras.json", mimeType: "application/json", buffer: payload });
  await expect(toast(page, "Se importó 1 letra")).toBeVisible();

  await page.locator("#song-search").fill(importedTitle);
  await expect(page.getByText(importedTitle, { exact: true })).toBeVisible();
});
