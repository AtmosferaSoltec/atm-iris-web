"use client";

import { useEffect, useState } from "react";
import type { BibleChapter } from "@/domain/models";
import { bibleChapter } from "./actions";

/** Chapters already read in this console: going back and forth never asks twice. */
const cache = new Map<string, BibleChapter>();
const keyOf = (bookId: string, chapter: number) => `${bookId}.${chapter}`;

/** A chapter, from memory or from the API; null when it does not exist. */
export async function loadChapter(bookId: string, chapter: number): Promise<BibleChapter | null> {
  const key = keyOf(bookId, chapter);
  const cached = cache.get(key);
  if (cached) return cached;
  const result = await bibleChapter(bookId, chapter);
  if (result.chapter) cache.set(key, result.chapter);
  return result.chapter ?? null;
}

type State = { key: string; chapter: BibleChapter | null };

/** A chapter's verses for the picker, read once and kept while the console is open. */
export function useChapter(bookId: string | null, chapter: number | null) {
  const key = bookId && chapter ? keyOf(bookId, chapter) : null;
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    if (!key || !bookId || !chapter || cache.has(key)) return;
    let cancelled = false;
    void loadChapter(bookId, chapter).then((found) => {
      if (!cancelled) setState({ key, chapter: found });
    });
    return () => {
      cancelled = true;
    };
  }, [key, bookId, chapter]);

  if (!key) return { chapter: null, isLoading: false, isMissing: false };
  const cached = cache.get(key);
  if (cached) return { chapter: cached, isLoading: false, isMissing: false };
  const current = state?.key === key ? state : null;
  return {
    chapter: current?.chapter ?? null,
    isLoading: !current,
    isMissing: !!current && !current.chapter,
  };
}
