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
