import { expect, test, type Page } from "@playwright/test";
import { addToService, signIn, toast } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("la consola manda la letra y el fondo a la pantalla abierta en otra ventana", async ({
  page,
  context,
}) => {
  // Signing in lands on the console ("/"), which the screen would already hear: step aside first.
  await page.goto("/settings");
  const screen = await context.newPage();
  await screen.goto("/display");
  await expect(screen.getByText("Esperando la consola", { exact: false })).toBeVisible();

  await page.goto("/");
  // The screen hears the console: it stops waiting for it.
  await expect(screen.getByText("Esperando la consola", { exact: false })).toHaveCount(0);

  // The service is the plan: adding a song here adds it there too.
  await addToService(page, "Castillo fuerte");
  await expect(page.getByRole("heading", { name: "Castillo fuerte" })).toBeVisible();

  await page
    .getByRole("button", { name: /Enviar a la pantalla/ })
    .first()
    .click();
  await expect(screen.getByText("Castillo fuerte es nuestro Dios", { exact: false })).toBeVisible();

  // B clears the screen: only the background stays.
  await page.keyboard.press("b");
  await expect(screen.getByText("Castillo fuerte es nuestro Dios", { exact: false })).toHaveCount(
    0,
  );
  await page.keyboard.press("b");
  await expect(screen.getByText("Castillo fuerte es nuestro Dios", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Fondo" }).click();
  // No backgrounds by default: only black, selected, and the card to add one.
  await expect(page.getByRole("button", { name: "Negro" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Agregar fondo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Océano" })).toHaveCount(0);
  await page.keyboard.press("Escape");

  // The service is the plan: it is still there after a reload, and "Vaciar" empties it.
  await page.reload();
  await expect(page.getByText("Castillo fuerte", { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "Vaciar" }).first().click();
  await page.getByRole("button", { name: "Quitar 1 elemento" }).click();
  await page.reload();
  await expect(page.getByText("Castillo fuerte", { exact: false })).toHaveCount(1);
});

/** «Texto» lives in the Herramientas menu: open it and pick the card. */
async function openTextTool(page: Page) {
  await page.getByRole("button", { name: "Herramientas", exact: true }).click();
  await page.getByRole("button", { name: "Texto", exact: true }).click();
}

test("«Texto» cambia la fuente, el tamaño y el estilo de la letra en la pantalla", async ({
  page,
  context,
}) => {
  const screen = await context.newPage();
  await screen.goto("/display");
  await page.goto("/");
  await addToService(page, "Castillo fuerte");
  await page
    .getByRole("button", { name: /Enviar a la pantalla/ })
    .first()
    .click();
  const lyrics = screen.getByText("Castillo fuerte es nuestro Dios", { exact: false });
  await expect(lyrics).toBeVisible();

  await openTextTool(page);
  const dialog = page.getByRole("dialog", { name: "Texto" });
  await dialog.getByRole("button", { name: /Lora/ }).click();
  await dialog.getByRole("button", { name: "Negrita", exact: true }).click();
  await dialog.getByRole("button", { name: "Mayúsculas", exact: true }).click();
  await dialog.getByRole("button", { name: "Más grande" }).click();
  await dialog.getByRole("button", { name: "Aplicar" }).click();

  const style = lyrics.locator("xpath=ancestor::div[contains(@style,'font-family')][1]");
  await expect(style).toHaveCSS("font-weight", "700");
  await expect(style).toHaveCSS("text-transform", "uppercase");
  await expect(style).toHaveAttribute("style", /projection-lora/);

  // Kept for the church: a reload still has it.
  await expect(toast(page, "Texto actualizado")).toBeVisible();
  await page.reload();
  await openTextTool(page);
  await expect(
    page.getByRole("dialog", { name: "Texto" }).getByRole("button", { name: /Lora/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Vaciar" }).first().click();
  await page.getByRole("button", { name: /^Quitar/ }).click();
});
