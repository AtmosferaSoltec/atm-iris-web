import { expect, test } from "@playwright/test";
import { OWNER, signIn } from "./helpers";

test("signs in and out", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText("Iglesia Vida Nueva").first()).toBeVisible();
  await page
    .getByRole("button", { name: /Cuenta:/ })
    .last()
    .click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/login");
});

test("shows wrong credentials", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#email").fill("error@vidanueva.org");
  await page.locator("#password").fill("x");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(
    page.getByText("El correo o la contraseña no coinciden", { exact: false }),
  ).toBeVisible();
});

test("sign-up validates and reports a taken email", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("radio", { name: "Crear cuenta" }).click();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByText("Escribe el nombre de tu iglesia.")).toBeVisible();
  await expect(page.getByText("Escribe el nombre del responsable.")).toBeVisible();

  await page.locator("#churchName").fill("Iglesia Nueva Esperanza");
  await page.locator("#fullName").fill("Rut Salas");
  await page.locator("#email").fill("existe@correo.com");
  await page.locator("#password").fill("corta");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByText("Usa al menos 8 caracteres.")).toBeVisible();

  await page.locator("#password").fill("una-clave-larga");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByText("Ya existe una cuenta con ese correo.")).toBeVisible();
});

test("recovers the password in three steps", async ({ page }) => {
  await page.goto("/recuperar");
  await page.locator("#email").fill(OWNER);
  await page.getByRole("button", { name: "Enviar código" }).click();
  await expect(page).toHaveURL("/recuperar/codigo");

  await page.locator("#code").fill("000000");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("El código no es válido", { exact: false })).toBeVisible();
  await page.locator("#code").fill("123456");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL("/recuperar/nueva");

  await page.locator("#password").fill("vidanueva123");
  await page.locator("#passwordConfirmation").fill("vidanueva123");
  await page.getByRole("button", { name: "Guardar y volver a iniciar sesión" }).click();
  await expect(page).toHaveURL("/login?restablecida=1");
  await expect(page.getByText("Tu contraseña quedó actualizada", { exact: false })).toBeVisible();
});
