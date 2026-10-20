"use server";

import { z } from "zod";
import { BIBLE_BOOK_BY_ID, DEFAULT_TRANSLATION } from "@/domain/bible-books";
import type { BibleChapter } from "@/domain/models";
import { authorize } from "@/server/dal";
import { errorMessage } from "@/server/repositories/api/errors";

const chapterSchema = z.object({
  bookId: z.string().refine((id) => BIBLE_BOOK_BY_ID.has(id)),
  chapter: z.number().int().min(1).max(150),
});

/** One chapter of the church's Bible (contract §13), to choose verses from. */
export async function bibleChapter(
  bookId: string,
  chapter: number,
): Promise<{ chapter?: BibleChapter; error?: string }> {
  const parsed = chapterSchema.safeParse({ bookId, chapter });
  if (!parsed.success) return { error: "Ese capítulo no existe." };
  try {
    const { repos } = await authorize();
    const found = await repos.bible.chapter(
      DEFAULT_TRANSLATION.code,
      parsed.data.bookId,
      parsed.data.chapter,
    );
    return found ? { chapter: found } : { error: "Ese capítulo no existe." };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
