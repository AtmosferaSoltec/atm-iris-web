import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { addToService, signIn } from "./helpers";

test("un televisor se conecta con un código y muestra lo que manda la consola", async ({
  page,
  browser,
}) => {
  // The TV: its own browser, without a session.
  const tvContext = await browser.newContext();
  const tv = await tvContext.newPage();
  await tv.goto("/display");
  const code = tv.getByLabel(/^Código/);
  await expect(code).toHaveText(/^[A-Z2-9]{6}$/);

  await signIn(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Pantallas" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Código").fill((await code.textContent())!.toLowerCase());
  await dialog.getByLabel("Nombre").fill("TV del salón");
  await dialog.getByRole("button", { name: "Agregar pantalla" }).click();
  await expect(dialog.getByText("TV del salón")).toBeVisible();
  await expect(dialog.getByText("Encendida", { exact: true })).toBeVisible({ timeout: 10_000 });
  // The only screen presents.
  await expect(dialog.getByRole("radio", { name: /TV del salón/ })).toBeChecked();
  await page.keyboard.press("Escape");

  // A song on the screen reaches the TV over the channel.
  await addToService(page, "Castillo fuerte");
  await expect(page.getByRole("heading", { name: "Castillo fuerte" })).toBeVisible();
  await page
    .getByRole("button", { name: /Enviar a la pantalla/ })
    .first()
    .click();
  await expect(tv.getByText("Castillo fuerte es nuestro Dios", { exact: false })).toBeVisible();

  // It remembers the link: after a reload it goes straight to the projection.
  await tv.reload();
  await expect(tv.getByText("Castillo fuerte es nuestro Dios", { exact: false })).toBeVisible();

  // Unlinked from the console, it shows a code again.
  await page.getByRole("button", { name: "Pantallas" }).click();
  await page.getByRole("button", { name: "Desconectar TV del salón" }).click();
  await expect(tv.getByLabel(/^Código/)).toHaveText(/^[A-Z2-9]{6}$/);

  await page.getByRole("button", { name: "Cerrar", exact: true }).first().click();
  await page.getByRole("button", { name: "Vaciar" }).first().click();
  await page.getByRole("button", { name: "Quitar 1 elemento" }).click();
  await tvContext.close();
});

test("con varias pantallas solo proyecta la elegida; las demás no hacen nada", async ({
  page,
  browser,
}) => {
  const lyrics = "Castillo fuerte es nuestro Dios";
  const screens = [] as { name: string; tv: Page; context: BrowserContext }[];
  for (const name of ["Sala A", "Sala B"]) {
    const context = await browser.newContext();
    const tv = await context.newPage();
    await tv.goto("/display");
    await expect(tv.getByLabel(/^Código/)).toHaveText(/^[A-Z2-9]{6}$/);
    screens.push({ name, tv, context });
  }

  await signIn(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Pantallas" }).click();
  const dialog = page.getByRole("dialog");
  for (const { name, tv } of screens) {
    await dialog.getByLabel("Código").fill((await tv.getByLabel(/^Código/).textContent())!);
    await dialog.getByLabel("Nombre").fill(name);
    await dialog.getByRole("button", { name: "Agregar pantalla" }).click();
    await expect(dialog.getByRole("radio", { name: new RegExp(name) })).toBeVisible();
  }
  await expect(dialog.getByText("Encendida", { exact: true })).toHaveCount(2, { timeout: 15_000 });

  // The first one presents until another is chosen.
  await expect(dialog.getByRole("radio", { name: /Sala A/ })).toBeChecked();
  await dialog.getByRole("radio", { name: /Sala B/ }).click();
  await expect(dialog.getByRole("radio", { name: /Sala B/ })).toBeChecked();
  await page.keyboard.press("Escape");

  await addToService(page, "Castillo fuerte");
  await page
    .getByRole("button", { name: /Enviar a la pantalla/ })
    .first()
    .click();
  await expect(screens[1].tv.getByText(lyrics, { exact: false })).toBeVisible();
  await expect(screens[0].tv.getByText(lyrics, { exact: false })).toHaveCount(0);

  // Changing the screen: the new one gets everything, the old one goes blank.
  await page.getByRole("button", { name: "Pantallas" }).click();
  await dialog.getByRole("radio", { name: /Sala A/ }).click();
  await page.keyboard.press("Escape");
  await expect(screens[0].tv.getByText(lyrics, { exact: false })).toBeVisible();
  await expect(screens[1].tv.getByText(lyrics, { exact: false })).toHaveCount(0);

  await page.getByRole("button", { name: "Pantallas" }).click();
  for (const { name } of screens) {
    await dialog.getByRole("button", { name: `Desconectar ${name}` }).click();
  }
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Vaciar" }).first().click();
  await page.getByRole("button", { name: "Quitar 1 elemento" }).click();
  for (const { context } of screens) await context.close();
});
