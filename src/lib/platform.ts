export type Platform = "windows" | "mac" | "other";

/** El sistema del visitante, para destacar la descarga que le corresponde. */
export function detectPlatform(userAgent: string = navigator.userAgent): Platform {
  if (/windows/i.test(userAgent)) return "windows";
  if (/macintosh|mac os x/i.test(userAgent) && !/mobile/i.test(userAgent)) return "mac";
  return "other";
}

const megabytes = new Intl.NumberFormat("es", { maximumFractionDigits: 0 });

/** "182 MB". */
export function formatSize(bytes: number): string {
  return `${megabytes.format(bytes / 1_000_000)} MB`;
}
