import { CirclePlay, Disc3 } from "lucide-react";
import { cn } from "@/lib/cn";

/** Where a song's YouTube track comes from: YouTube (with video) or YouTube Music (only music). */
export function YouTubeBadge({ music, className }: { music: boolean; className?: string }) {
  const Icon = music ? Disc3 : CirclePlay;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1.5 text-xs text-ink-2", className)}
      title={music ? "Pista de YouTube Music: solo la música" : "Pista de YouTube: con video"}
    >
      <Icon aria-hidden className="size-3.5 text-danger" />
      {music ? "YT Music" : "YouTube"}
    </span>
  );
}
