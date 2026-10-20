import "server-only";
import { BIBLE_BOOK_BY_ID, DEFAULT_TRANSLATION } from "@/domain/bible-books";
import type { BibleRepository } from "../types";
import { SAMPLE_CHAPTERS } from "./bible-sample";

/** Placeholder chapters have this many verses. */
const PLACEHOLDER_VERSES = 25;

/** The API's Bible (contract §13) in memory: one translation, every chapter answers. */
export function mockBible(): BibleRepository {
  return {
    async chapter(code, bookId, chapter) {
      const book = BIBLE_BOOK_BY_ID.get(bookId);
      if (code !== DEFAULT_TRANSLATION.code || !book) return null;
      if (chapter < 1 || chapter > book.chapterCount) return null;
      const texts =
        SAMPLE_CHAPTERS[`${bookId}.${chapter}`] ??
        Array.from(
          { length: PLACEHOLDER_VERSES },
          (_, index) => `${book.name} ${chapter}:${index + 1} (texto de ejemplo).`,
        );
      return {
        bookId,
        chapter,
        verses: texts.map((text, index) => ({ number: index + 1, text })),
      };
    },
  };
}

/** Whether every verse of a passage exists, like the API checks before saving it. */
export async function mockPassageExists(
  bible: BibleRepository,
  passage: { code: string; bookId: string; chapter: number; from: number; to: number } | null,
): Promise<boolean> {
  if (!passage) return false;
  const chapter = await bible.chapter(passage.code, passage.bookId, passage.chapter);
  return !!chapter && passage.to <= chapter.verses.length;
}
