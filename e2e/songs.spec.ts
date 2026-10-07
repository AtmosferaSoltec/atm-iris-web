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
