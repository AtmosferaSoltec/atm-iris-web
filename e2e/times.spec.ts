import { expect, test } from "@playwright/test";
import { signIn, toast } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("shows a record and adjusts one of its blocks", async ({ page }) => {
  await page.goto("/tiempos");
  const detail = page.locator("article");
  await expect(detail.getByRole("heading", { name: "Culto general" })).toBeVisible();
  await expect(detail.getByText("Duración")).toBeVisible();

  await page.getByRole("button", { name: "Opciones del bloque Bienvenida" }).click();
  await page.getByRole("menuitem", { name: "Ajustar duración…" }).click();
  await page.getByRole("combobox", { name: "Minutos" }).click();
  await page.getByRole("option", { name: "12", exact: true }).click();
  await page.getByRole("combobox", { name: "Segundos" }).click();
  await page.getByRole("option", { name: "30", exact: true }).click();
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(toast(page, "Duración ajustada")).toBeVisible();
  const bienvenida = detail.locator("li").filter({ hasText: "Bienvenida" });
  await expect(bienvenida).toContainText("Ajustado");
  await expect(bienvenida).toContainText("12:30");
  await expect(bienvenida).toContainText("+2:30");
});

test("summaries match the iPad's sample church", async ({ page }) => {
  await page.goto("/tiempos?tab=summaries&period=all");
  await expect(page.getByText("Bloques pasados")).toBeVisible();
  await expect(page.locator("dl")).toContainText("Servicios");
  await expect(page.getByRole("button", { name: /Ver sus bloques: Daniel Ruiz/ })).toBeVisible();
});
