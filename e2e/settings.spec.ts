import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("Ajustes has the church and its space, without modules or plans", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Iglesia" })).toBeVisible();
  await expect(page.getByRole("meter", { name: "Almacenamiento usado" })).toBeVisible();
  await expect(page.getByText("5 GB", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("switch")).toHaveCount(0);
  await expect(page.getByText("Plan Plus", { exact: false })).toHaveCount(0);

  // Everything is always in the menu.
  for (const item of ["Canciones", "Multimedia", "Fondos", "Personas", "Tiempos"]) {
    await expect(
      page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: item }),
    ).toBeVisible();
  }
});
