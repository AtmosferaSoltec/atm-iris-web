import { expect, test } from "@playwright/test";
import { signIn, toast, unique } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("adds, rejects duplicates and renames people", async ({ page }) => {
  const name = unique("Rut");
  await page.goto("/personas");
  await page.getByLabel("Nueva persona").fill(name);
  await page.keyboard.press("Enter");
  await expect(toast(page, `Se agregó a ${name}`)).toBeVisible();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  await page.getByLabel("Nueva persona").fill(`  ${name.toUpperCase()} `);
  await page.getByRole("button", { name: "Agregar" }).click();
  await expect(page.getByText("Ya existe una persona con ese nombre.")).toBeVisible();

  await page.getByRole("button", { name: `Renombrar a ${name}` }).click({ force: true });
  await page.getByRole("dialog").getByRole("textbox").fill(`${name} Salas`);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(toast(page, "Nombre actualizado")).toBeVisible();
  await expect(page.getByText(`${name} Salas`, { exact: true })).toBeVisible();
});
