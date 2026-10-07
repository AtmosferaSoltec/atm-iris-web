import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("a module switched off for all of Iris is not offered in Ajustes", async ({ page }) => {
  await page.goto("/ajustes");
  await expect(page.getByRole("switch", { name: "Multimedia" })).toBeVisible();
  await expect(page.getByRole("switch", { name: "Control de tiempo" })).toBeVisible();
  // The Bible is off for every church today (system_features).
  await expect(page.getByRole("switch", { name: "Biblia" })).toHaveCount(0);
  await expect(page.getByText("Busca y proyecta versículos", { exact: false })).toHaveCount(0);
});
