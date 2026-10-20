import { expect, test } from "@playwright/test";
import { signIn, unique } from "./helpers";

test.beforeEach(async ({ page }) => signIn(page));

test("el servicio elegido sigue ahí al recargar o volver, hasta que se finaliza", async ({
  page,
}) => {
  // Straight to the console: no question on the way in.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /¿Qué servicio/ })).toHaveCount(0);

  await page.getByRole("button", { name: "Seleccionar servicio" }).click();
  await page.getByRole("button", { name: /Culto general/ }).click();
  await expect(page.getByText("4 bloques · 1 h 10 min")).toBeVisible();

  // Chosen but not started: a reload keeps it.
  await page.reload();
  await expect(page.getByText("4 bloques · 1 h 10 min")).toBeVisible();

  // "Comenzar" starts the first block at once; the leader is set from its name.
  await page.getByRole("button", { name: "Comenzar" }).click();
  await expect(page.getByText("/ 10:00")).toBeVisible();
  await page.getByRole("button", { name: /Elegir responsable/ }).click();
  const leaders = page.getByRole("dialog", { name: /¿Quién dirige/ });
  await expect(leaders.getByRole("button", { name: "Sin responsable" })).toHaveCount(0);
  await leaders.getByRole("radio", { name: "Carlos Pérez" }).click();
  await leaders.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("· Carlos Pérez")).toBeVisible();

  // Someone who is not in the list yet is added right there.
  await page.getByRole("button", { name: /Carlos Pérez/ }).click();
  const newcomer = unique("Ana Torres");
  await leaders.getByLabel("Buscar o agregar persona").fill(newcomer);
  await leaders.getByRole("button", { name: `Agregar «${newcomer}»` }).click();
  await expect(page.getByText(`· ${newcomer}`)).toBeVisible();

  // No skipping: every block is run, one after the other.
  await expect(page.getByRole("button", { name: /Omitir/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Siguiente: Alabanzas/ }).click();
  await page.getByRole("button", { name: /Siguiente: Prédica/ }).click();
  await expect(page.getByText("/ 40:00")).toBeVisible();

  // Going to Tiempos and back: still running, no "retomar".
  await page.goto("/times");
  await page.goto("/");
  await expect(page.getByText("/ 40:00")).toBeVisible();
  await expect(page.getByText(/Retomar/)).toHaveCount(0);

  // "Finalizar servicio" only shows in the last block.
  await expect(page.getByRole("button", { name: "Finalizar servicio" })).toHaveCount(0);
  await page.getByRole("button", { name: /^Siguiente:/ }).click();
  await page.getByRole("button", { name: "Finalizar servicio" }).click();
  await page.getByRole("button", { name: "Finalizar", exact: true }).click();
  await expect(page.getByText("Servicio finalizado")).toBeVisible();

  // Finished: the next visit starts with nothing chosen.
  await page.reload();
  await expect(page.getByRole("button", { name: "Seleccionar servicio" })).toBeVisible();

  await page.goto("/times");
  await expect(page.getByRole("button", { name: /Culto general/ }).first()).toBeVisible();
});

test("sin servicios a mano, se crea uno desde la consola con sus bloques", async ({ page }) => {
  const name = unique("Vigilia");
  await page.goto("/");
  await page.getByRole("button", { name: "Seleccionar servicio" }).click();
  await page.getByRole("button", { name: "Crear servicio" }).click();
  await page.locator("#quick-service-name").fill(name);
  await page.getByLabel("Nombre del bloque 1").fill("Bienvenida");
  await page.getByRole("button", { name: "Agregar bloque" }).click();
  await page.getByLabel("Nombre del bloque 2").fill("Mensaje");
  await page.getByLabel("Minutos del bloque 2").fill("30");
  await page.getByRole("button", { name: "Crear y seleccionar" }).click();

  await expect(page.getByText("2 bloques · 40 min")).toBeVisible();
  // It stays among the services to choose from.
  await page.reload();
  await page
    .getByRole("button", { name: "Cambiar" })
    .or(page.getByRole("button", { name: "Seleccionar servicio" }))
    .first()
    .click();
  await expect(page.getByRole("button", { name: new RegExp(name) })).toBeVisible();
});
