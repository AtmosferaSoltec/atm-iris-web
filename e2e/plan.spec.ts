import { expect, test } from "@playwright/test";
import { signIn, toast } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("agrega, reordena, quita y vacía el plan", async ({ page }) => {
  await page.goto("/plan");
  await expect(page.getByText("El plan está vacío")).toBeVisible();

  // Agregar dos canciones desde el buscador.
  await page.getByRole("button", { name: "Agregar" }).first().click();
  await page.locator("#plan-search").fill("Sublime gracia");
  await page
    .getByRole("listitem")
    .filter({ hasText: "Sublime gracia" })
    .getByRole("button", { name: "Agregar" })
    .click();
  await expect(toast(page, "Se agregó «Sublime gracia» al plan")).toBeVisible();

  await page.locator("#plan-search").fill("Roca de la eternidad");
  await page
    .getByRole("listitem")
    .filter({ hasText: "Roca de la eternidad" })
    .getByRole("button", { name: "Agregar" })
    .click();
  await expect(toast(page, "Se agregó «Roca de la eternidad» al plan")).toBeVisible();

  await page.keyboard.press("Escape");

  // Quedan en el orden en que se agregaron.
  const rows = page.getByRole("list").last().getByRole("listitem");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Sublime gracia");
  await expect(rows.nth(1)).toContainText("Roca de la eternidad");

  // Reordenar: subir el segundo.
  await rows.nth(1).getByRole("button", { name: "Subir" }).click();
  await expect(rows.nth(0)).toContainText("Roca de la eternidad");
  await expect(rows.nth(1)).toContainText("Sublime gracia");

  // Quitar uno.
  await rows
    .nth(1)
    .getByRole("button", { name: /Quitar/ })
    .click();
  await expect(rows).toHaveCount(1);

  // Vaciar todo.
  await page.getByRole("button", { name: "Vaciar" }).click();
  await page.getByRole("button", { name: "Vaciar", exact: true }).last().click();
  await expect(page.getByText("El plan está vacío")).toBeVisible();
});
