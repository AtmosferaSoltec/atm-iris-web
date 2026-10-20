/** Cookie with the service chosen in the console: `<churchId>:<serviceTypeId>`. */
export const SELECTED_SERVICE_COOKIE = "iris_console_service";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Written in the browser, synchronously: a reload right after choosing must still find it. */
export function writeSelectedService(churchId: string, typeId: string | null): void {
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = typeId
    ? `${SELECTED_SERVICE_COOKIE}=${churchId}:${typeId}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax${secure}`
    : `${SELECTED_SERVICE_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
}
