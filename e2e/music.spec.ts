import { expect, test } from "@playwright/test";
import { pngImage, signIn, toast, unique } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("uploads several tracks to Música and keeps them out of Multimedia", async ({ page }) => {
  const first = unique("Preludio");
  const second = unique("Ofrenda");
  await page.goto("/musica");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Subir música" }).click();
  await (
    await chooser
  ).setFiles([
    { name: `${first}.mp3`, mimeType: "audio/mpeg", buffer: Buffer.from("ID3 pista uno") },
    { name: `${second}.mp3`, mimeType: "audio/mpeg", buffer: Buffer.from("ID3 pista dos") },
    { name: "foto.png", mimeType: "image/png", buffer: pngImage(640, 360) },
  ]);

  const queue = page.getByRole("region", { name: "Subidas" });
  await expect(queue.getByText("Aquí solo se sube música", { exact: false })).toBeVisible();
  await expect(toast(page, `Se subió «${first}»`)).toBeVisible();
  await expect(toast(page, `Se subió «${second}»`)).toBeVisible();
  await expect(page.getByRole("button", { name: first, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: second, exact: true })).toBeVisible();

  await page.goto("/multimedia");
  await expect(page.getByRole("button", { name: first, exact: true })).toHaveCount(0);

  await page.goto("/ajustes");
  await expect(page.getByRole("meter", { name: "Almacenamiento usado" })).toBeVisible();
  for (const section of ["Música", "Fondos", "Multimedia"]) {
    await expect(page.getByRole("term").filter({ hasText: section })).toBeVisible();
  }
});

test("Canciones is now Letras", async ({ page }) => {
  await page.goto("/canciones");
  await expect(page).toHaveURL("/letras");
  await expect(page.getByRole("heading", { name: "Letras", level: 1 })).toBeVisible();
});
