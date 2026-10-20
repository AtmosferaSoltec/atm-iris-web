import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("V, «Juan 3:16» y Enter: el versículo sale en pantalla sin pasar por el servicio", async ({
  page,
  context,
}) => {
  const screen = await context.newPage();
  await screen.goto("/display");
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Servicio" }).or(page.locator("h1")).first(),
  ).toBeVisible();

  await page.keyboard.press("v");
  const dialog = page.getByRole("dialog", { name: "Biblia" });
  await dialog.getByLabel("Versículo").fill("Juan 3:16");
  await expect(dialog.getByText("Enter para proyectar")).toBeVisible();
  await dialog.getByLabel("Versículo").press("Enter");

  await expect(dialog).toBeHidden();
  await expect(screen.getByText("de tal manera amó Dios al mundo", { exact: false })).toBeVisible();
  await expect(screen.getByText("Juan 3:16 · RVR1909")).toBeVisible();
  // Never in the service.
  await expect(page.getByRole("button", { name: "Quitar «Juan 3:16»" })).toHaveCount(0);

  // The verse after and before: arrows or buttons.
  await page.keyboard.press("ArrowRight");
  await expect(screen.getByText("Juan 3:17 · RVR1909")).toBeVisible();
  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(screen.getByText("Juan 3:18 · RVR1909")).toBeVisible();
  await page.getByRole("button", { name: "Anterior" }).click();
  await page.getByRole("button", { name: "Anterior" }).click();
  await page.getByRole("button", { name: "Anterior" }).click();
  await expect(screen.getByText("Juan 3:15 · RVR1909")).toBeVisible();
});

test("también se elige libro, capítulo y versículo con clics", async ({ page, context }) => {
  const screen = await context.newPage();
  await screen.goto("/display");
  await page.goto("/");
  await page.getByRole("button", { name: /^Biblia/ }).click();
  const dialog = page.getByRole("dialog", { name: "Biblia" });
  await dialog.getByRole("button", { name: "Salmos" }).click();
  await dialog.getByRole("button", { name: "Salmos 23" }).click();
  await dialog.getByRole("button", { name: "1", exact: true }).click();
  await expect(screen.getByText("Salmos 23:1 · RVR1909")).toBeVisible();

  // A verse that does not exist says so and projects nothing.
  await page.getByRole("button", { name: /^Biblia/ }).click();
  await dialog.getByLabel("Versículo").fill("Juan 3:99");
  await dialog.getByLabel("Versículo").press("Enter");
  await expect(dialog.getByText("Ese versículo no existe.")).toBeVisible();
});
