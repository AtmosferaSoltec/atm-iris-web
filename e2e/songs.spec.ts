import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { pngImage, signIn, toast, unique } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

/** "Subir pistas": each audio file becomes a song with just that track. */
async function uploadTracks(page: Page, titles: string[]) {
  await page.goto("/canciones");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Subir pistas" }).click();
  await (
    await chooser
  ).setFiles(
    titles.map((title) => ({
      name: `${title}.mp3`,
      mimeType: "audio/mpeg",
      buffer: Buffer.from(`ID3 ${title}`),
    })),
  );
  for (const title of titles) {
    await expect(toast(page, `Se creó la canción «${title}»`)).toBeVisible();
  }
}

test("creates a song and finds it by its lyrics", async ({ page }) => {
  const title = unique("Canción");
  await page.goto("/canciones/nueva");
  await page.locator("#title").fill(title);
  await page.locator("#lyrics").fill("#Coro\nGloria en las alturas\n\nSegunda diapositiva");
  await expect(page.getByText("2 diapositivas")).toBeVisible();
  await expect(page.getByText("Coro", { exact: true })).toBeVisible();
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

test("a song needs lyrics or a track, and keeps the track it was given", async ({ page }) => {
  const title = unique("Con pista");
  await page.goto("/canciones/nueva");
  await page.locator("#title").fill(title);
  await page.getByRole("button", { name: "Guardar canción" }).click();
  await expect(page.getByText("Pega la letra o sube una pista", { exact: false })).toBeVisible();

  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Subir pista/ }).click();
  await (
    await chooser
  ).setFiles({ name: "hoy-te-salvo.mp3", mimeType: "audio/mpeg", buffer: Buffer.from("ID3 a") });
  await expect(toast(page, /Pista lista/)).toBeVisible();
  await expect(page.getByText("hoy-te-salvo.mp3")).toBeVisible();
  await expect(page.getByText("Solo pista")).toBeVisible();
  await page.getByRole("button", { name: "Guardar canción" }).click();
  await expect(toast(page, "Canción guardada")).toBeVisible();

  const row = page.getByRole("listitem").filter({ hasText: title });
  await expect(row.getByText("Solo pista", { exact: false })).toBeVisible();
  await expect(row.getByRole("button", { name: `Escuchar ${title}` })).toBeVisible();

  // Removing the track and adding lyrics turns it into a lyrics-only song.
  await row.getByRole("link").click();
  await page.locator("#lyrics").fill("Hoy te salvo");
  await page.getByRole("button", { name: "Quitar la pista" }).click();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(toast(page, "Canción guardada")).toBeVisible();
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: title })
      .getByRole("button", { name: `Escuchar ${title}` }),
  ).toHaveCount(0);
});

test("sube varias pistas: cada una es una canción, y rechaza lo que no es audio", async ({
  page,
}) => {
  const first = unique("Preludio");
  const second = unique("Ofrenda");
  await page.goto("/canciones");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Subir pistas" }).click();
  await (
    await chooser
  ).setFiles([
    { name: `${first}.mp3`, mimeType: "audio/mpeg", buffer: Buffer.from("ID3 pista uno") },
    { name: `${second}.mp3`, mimeType: "audio/mpeg", buffer: Buffer.from("ID3 pista dos") },
    { name: "foto.png", mimeType: "image/png", buffer: pngImage(640, 360) },
  ]);

  const queue = page.getByRole("region", { name: "Subidas" });
  await expect(queue.getByText("Una pista es un archivo de audio", { exact: false })).toBeVisible();
  await expect(toast(page, `Se creó la canción «${first}»`)).toBeVisible();
  await expect(toast(page, `Se creó la canción «${second}»`)).toBeVisible();
  await expect(page.getByRole("button", { name: `Escuchar ${first}` })).toBeVisible();
  await expect(page.getByRole("button", { name: `Escuchar ${second}` })).toBeVisible();

  // A track is part of its song: it never shows up in Multimedia.
  await page.goto("/multimedia");
  await expect(page.getByRole("button", { name: first, exact: true })).toHaveCount(0);

  await page.goto("/ajustes");
  await expect(page.getByRole("meter", { name: "Almacenamiento usado" })).toBeVisible();
  for (const section of ["Pistas", "Fondos", "Multimedia"]) {
    await expect(page.getByRole("term").filter({ hasText: section })).toBeVisible();
  }
});

test("selecciona varias canciones y las elimina de golpe", async ({ page }) => {
  const first = unique("Track A");
  const second = unique("Track B");
  await uploadTracks(page, [first, second]);

  await page.getByRole("button", { name: "Seleccionar", exact: true }).click();
  await page.getByRole("button", { name: `Seleccionar «${first}»` }).click();
  await page.getByRole("button", { name: `Seleccionar «${second}»` }).click();
  await expect(page.getByText("2 seleccionadas")).toBeVisible();

  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("button", { name: "Eliminar", exact: true }).last().click();
  await expect(toast(page, "Se eliminó 2 canciones")).toBeVisible();
  // The upload queue still lists the files; the songs themselves are gone.
  await expect(page.getByRole("button", { name: `Escuchar ${first}` })).toHaveCount(0);
  await expect(page.getByRole("button", { name: `Escuchar ${second}` })).toHaveCount(0);
});

test("Letras and Música lead to Canciones", async ({ page }) => {
  await page.goto("/musica");
  await expect(page).toHaveURL("/canciones");
  await expect(page.getByRole("heading", { name: "Canciones", level: 1 })).toBeVisible();
  // Served, not redirected: /canciones used to redirect permanently to /letras.
  await page.goto("/letras");
  await expect(page).toHaveURL("/letras");
  await expect(page.getByRole("heading", { name: "Canciones", level: 1 })).toBeVisible();
});

test("exporta las letras y las vuelve a importar en otra cuenta", async ({ page }) => {
  const title = unique("Letra para exportar");
  await page.goto("/canciones/nueva");
  await page.locator("#title").fill(title);
  await page.locator("#lyrics").fill("Primera diapositiva");
  await page.getByRole("button", { name: "Guardar canción" }).click();
  await expect(page).toHaveURL("/canciones");

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
