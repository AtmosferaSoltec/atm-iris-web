import { expect, test } from "@playwright/test";
import { signIn, toast, unique } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("creates a service with blocks", async ({ page }) => {
  const name = unique("Vigilia");
  await page.goto("/servicios/nuevo");
  await page.locator("#name").fill(name);
  await page.getByRole("switch", { name: "Tiene horario fijo" }).click();
  await page.getByRole("radio", { name: "Vie" }).click();
  await page.getByRole("switch", { name: "Controlar el tiempo de este servicio" }).click();
  await expect(page.getByRole("combobox", { name: /Responsable de/ })).toHaveCount(0);
  await expect(page.getByLabel("Nombre del bloque 1")).toHaveValue("");
  await page.getByLabel("Nombre del bloque 1").fill("Bienvenida");
  await page.getByRole("button", { name: "Agregar bloque" }).click();
  // A new block starts empty and focused, ready to type.
  await expect(page.getByLabel("Nombre del bloque 2")).toHaveValue("");
  await expect(page.getByLabel("Nombre del bloque 2")).toBeFocused();
  await page.getByLabel("Nombre del bloque 2").fill("Oración");
  // The minutes buttons move in steps of 5.
  await page.getByRole("button", { name: "Más 5 minutos" }).first().click();
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page).toHaveURL("/servicios");
  await expect(toast(page, "Servicio guardado")).toBeVisible();
  const card = page.getByRole("link", { name: `Editar ${name}` });
  await expect(card).toContainText("Viernes · 10:00");
  await expect(card).toContainText("2 bloques · 25 min");
});

test("rejects a duplicate name, ignoring accents, case and spaces", async ({ page }) => {
  await page.goto("/servicios/nuevo");
  await page.locator("#name").fill("  CULTO   general ");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Ya existe un servicio con ese nombre.")).toBeVisible();
  await expect(page).toHaveURL("/servicios/nuevo");
});
