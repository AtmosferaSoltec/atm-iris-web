import { createLoader, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

// Filters, search and pagination live in the URL: shareable and they survive a
// reload. The same parsers serve the page (server, `load*`) and the controls
// (client, `useQueryStates`). `nuqs/server` holds no server-only code.

export const pageParser = parseAsInteger.withDefault(1);
export const searchParser = parseAsString.withDefault("");

/* ---------------------------------------------------------------- Songs */

export const SONG_SORTS = ["title", "-updatedAt"] as const;

export const songSearchParams = {
  search: searchParser,
  page: pageParser,
  sort: parseAsStringLiteral(SONG_SORTS).withDefault("title"),
};
export const loadSongSearchParams = createLoader(songSearchParams);

/* ---------------------------------------------------------------- Media */

export const mediaSearchParams = {
  search: searchParser,
  page: pageParser,
};
export const loadMediaSearchParams = createLoader(mediaSearchParams);

/* ---------------------------------------------------------------- Times */

export const TIME_TABS = ["records", "summaries"] as const;
export const TIME_PERIODS = [
  "thisMonth",
  "lastMonth",
  "last3Months",
  "thisYear",
  "all",
  "month",
] as const;

export const timeSearchParams = {
  tab: parseAsStringLiteral(TIME_TABS).withDefault("records"),
  /** Records tab: service type filter and selected record. */
  service: parseAsString.withDefault(""),
  record: parseAsString.withDefault(""),
  /** Summaries tab. `month` is "2026-09" when period = month. */
  period: parseAsStringLiteral(TIME_PERIODS).withDefault("last3Months"),
  month: parseAsString.withDefault(""),
  block: parseAsString.withDefault(""),
  person: parseAsString.withDefault(""),
};
export const loadTimeSearchParams = createLoader(timeSearchParams);
