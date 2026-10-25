import { expect, test } from "@playwright/test";
import { pngImage, signIn, toast, unique } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("la pantalla baja un fondo una sola vez, lo guarda en su disco y tras reiniciar no lo vuelve a descargar", async ({
  page,
  context,
}) => {
  const title = unique("Telón");
  await page.goto("/settings");
  const screen = await context.newPage();
  // Every download of a file by the screen (the mock storage stands in for the signed URLs).
  let downloads = 0;
  await screen.route("**/api/mock-storage/**", (route) => {
    if (route.request().method() === "GET") downloads += 1;
    return route.continue();
  });
  await screen.goto("/display");
  await expect(screen.getByText("Esperando la consola", { exact: false })).toBeVisible();

  await page.goto("/");
  await page.getByRole("button", { name: "Fondo", exact: true }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Agregar fondo" }).click();
  await (
    await chooser
  ).setFiles({ name: `${title}.png`, mimeType: "image/png", buffer: pngImage(640, 640) });
  await expect(toast(page, `Fondo «${title}» listo`)).toBeVisible();
  await page.getByRole("button", { name: title, exact: true }).click();

  // On the screen it is drawn from the local copy, and the file travelled once (not a second
  // time for the picture itself while the copy was still coming).
  const background = screen.locator("img[src^='blob:']");
  await expect(background).toBeVisible();
  expect(downloads).toBe(1);

  // And it is on the TV's own disk.
  const stored = () =>
    screen.evaluate(async () => (await (await caches.open("iris-display-files-v1")).keys()).length);
  await expect.poll(stored).toBeGreaterThanOrEqual(1);

  // The TV is switched off and on: a new page. It takes the file from the disk.
  downloads = 0;
  await screen.reload();
  await expect(background).toBeVisible();
  expect(downloads).toBe(0);

  // The backgrounds panel is still open from choosing it.
  await page.getByRole("button", { name: `Eliminar el fondo ${title}` }).click();
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await expect(page.getByRole("button", { name: title, exact: true })).toHaveCount(0);
});
