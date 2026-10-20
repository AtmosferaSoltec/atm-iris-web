import { expect, test, type Locator, type Page } from "@playwright/test";
import { addToService, signIn } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

/** A real mouse drag: it passes the 6 px a drag needs to start, then glides to the target. */
async function drag(page: Page, from: Locator, to: Locator, edge: "top" | "bottom") {
  const start = (await from.boundingBox())!;
  const end = (await to.boundingBox())!;
  const x = start.x + 60;
  const y = start.y + start.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 12, { steps: 3 });
  await page.mouse.move(end.x + 60, edge === "top" ? end.y + 3 : end.y + end.height - 3, {
    steps: 20,
  });
  await page.mouse.up();
}

const services = (page: Page) =>
  page.getByRole("list", { name: "Elementos del servicio" }).locator("> li");
const titles = (page: Page) => services(page).locator("span.truncate.text-sm.font-semibold");

test("el servicio se ordena arrastrando y recibe lo arrastrado desde la biblioteca", async ({
  page,
}) => {
  await page.goto("/");
  const add = (title: string) => addToService(page, title);

  await add("Castillo fuerte");
  await expect(titles(page)).toHaveText(["Castillo fuerte"]);
  await add("Sublime gracia");
  await expect(titles(page)).toHaveText(["Castillo fuerte", "Sublime gracia"]);
  // No up/down arrows any more: rows are dragged.
  await expect(page.getByRole("button", { name: "Subir", exact: true })).toHaveCount(0);

  // The second row goes first.
  await drag(page, services(page).nth(1), services(page).nth(0), "top");
  await expect(titles(page)).toHaveText(["Sublime gracia", "Castillo fuerte"]);

  // The order is the plan's: it survives a reload.
  await page.reload();
  await expect(titles(page)).toHaveText(["Sublime gracia", "Castillo fuerte"]);

  // A song dragged from the library lands between two rows.
  const library = page.getByRole("button", { name: "Agregar «Santo, santo, santo» al servicio" });
  await drag(
    page,
    library.locator("xpath=ancestor::div[contains(@class,'group')][1]"),
    services(page).nth(1),
    "top",
  );
  await expect(titles(page)).toHaveText([
    "Sublime gracia",
    "Santo, santo, santo",
    "Castillo fuerte",
  ]);

  // Cleaning up: the mock world is shared by the other tests.
  await page.getByRole("button", { name: "Vaciar" }).first().click();
  await page.getByRole("button", { name: /^Quitar 3 elementos/ }).click();
  await expect(services(page)).toHaveCount(0);
});
