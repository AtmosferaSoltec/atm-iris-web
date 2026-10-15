import { expect, test } from "@playwright/test";

test("the download page is public and points to the installer", async ({ page }) => {
  await page.goto("/downloads");
  await expect(page).toHaveURL("/downloads");
  await expect(page.getByRole("heading", { name: /Descarga Iris/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Descargar para Windows" })).toHaveAttribute(
    "href",
    "/downloads/windows/Iris-Setup.exe",
  );
});

test("visitors see the landing at / and can go to the login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1, name: /ilumine/ })).toBeVisible();

  await page.getByRole("banner").getByRole("link", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/login");
});

test("the landing opens the sign-up tab", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("main").getByRole("link", { name: "Crear la cuenta de mi iglesia" }).click();
  await expect(page).toHaveURL("/login?modo=crear");
  await expect(page.getByText("Crea el espacio de tu iglesia")).toBeVisible();
});
