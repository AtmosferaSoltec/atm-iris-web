import { expect, test } from "@playwright/test";
import { chooseInSubmenu, signIn, toast } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("invites by email", async ({ page }) => {
  const email = `nuevo${Date.now()}@correo.com`;
  await page.goto("/equipo");
  await page.getByRole("button", { name: "Invitar" }).click();
  await page.getByRole("dialog").locator("#email").fill("admin@vidanueva.org");
  await page.getByRole("button", { name: "Enviar invitación" }).click();
  await expect(page.getByText("Esa persona ya es parte del equipo.").first()).toBeVisible();

  await page.getByRole("dialog").locator("#email").fill(email);
  await page.getByRole("button", { name: "Enviar invitación" }).click();
  await expect(toast(page, `Invitación enviada a ${email}`)).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});

test("changes a role and keeps the last owner", async ({ page }) => {
  await page.goto("/equipo");
  await page.getByRole("button", { name: "Opciones de Carlos Pérez" }).click();
  await chooseInSubmenu(page, "Cambiar rol", "Administrador");
  await expect(toast(page, "Carlos Pérez ahora es administrador")).toBeVisible();
  await page.getByRole("button", { name: "Opciones de Carlos Pérez" }).click();
  await chooseInSubmenu(page, "Cambiar rol", "Operador");
  await expect(toast(page, "Carlos Pérez ahora es operador")).toBeVisible();

  // The pastor is the only owner: stepping down is refused (LAST_OWNER).
  await page.getByRole("button", { name: "Opciones de Daniel Ruiz" }).click();
  await chooseInSubmenu(page, "Cambiar rol", "Administrador");
  await expect(toast(page, /al menos un dueño/)).toBeVisible();
});
