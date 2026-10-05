import { deflateSync } from "node:zlib";
import { expect, type Page } from "@playwright/test";

export const OWNER = "pastor@vidanueva.org";
export const ADMIN = "admin@vidanueva.org";
export const OPERATOR = "operador@vidanueva.org";

/** Mock sign-in: any password works for the seeded accounts. */
export async function signIn(page: Page, email = OWNER) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("vidanueva123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
}

/** Unique per run, so tests never collide with each other's data. */
export function unique(prefix: string): string {
  return `${prefix} ${Date.now().toString(36).slice(-5)}`;
}

/** Radix submenus open with the keyboard; a pointer jumping straight to them can close them. */
export async function chooseInSubmenu(page: Page, submenu: string, item: string) {
  await page.getByRole("menuitem", { name: submenu }).focus();
  await page.keyboard.press("ArrowRight");
  await page.getByRole("menuitemradio", { name: item }).focus();
  await page.keyboard.press("Enter");
}

export function toast(page: Page, text: string | RegExp) {
  return page.locator("[data-sonner-toast]").filter({ hasText: text });
}

/** A real PNG (gradient), so the browser can measure it like an uploaded photo. */
export function pngImage(width: number, height: number): Buffer {
  const rows: number[] = [];
  for (let y = 0; y < height; y++) {
    rows.push(0);
    for (let x = 0; x < width; x++) rows.push((x * 255) / width, 90, (y * 255) / height);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(Buffer.from(rows))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    let c = (crc ^ byte) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
