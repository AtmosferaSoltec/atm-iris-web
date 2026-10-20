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

  await page.getByRole("link", { name: "Volver al servicio" }).click();
  await expect(page).toHaveURL("/");
});

test("the console's avatar menu leads to Tiempos and Ajustes, and signs out", async ({ page }) => {
  await page.getByRole("button", { name: /^Cuenta:/ }).click();
  await expect(page.getByRole("menuitem", { name: "Tiempos" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Cerrar sesión" })).toBeVisible();
  await page.getByRole("menuitem", { name: "Ajustes" }).click();
  await expect(page).toHaveURL("/settings");
});
