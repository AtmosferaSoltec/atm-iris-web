"use client";

import { createContext, useContext } from "react";

/**
 * Where a canvas takes a file from. The screen keeps its files in memory and resolves
 * them to local `blob:` URLs, so showing a background never touches the network; the
 * console draws straight from the signed URL.
 */
export type ResolveFile = (id: string, url: string) => string;

const ResolveFileContext = createContext<ResolveFile>((_id, url) => url);

export const FileResolverProvider = ResolveFileContext.Provider;

export function useResolveFile(): ResolveFile {
  return useContext(ResolveFileContext);
}
