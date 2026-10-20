import {
  Bell,
  Drum,
  Guitar,
  Hand,
  Heart,
  Laugh,
  Megaphone,
  Mic,
  Music,
  PartyPopper,
  Siren,
  Sparkles,
  Trophy,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import type { MediaAsset } from "@/domain/models";
import type { SoundEntry } from "../model";

/** The icons a sound can wear: the key is what the API stores in `soundIcon`. */
export const SOUND_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  volume: { icon: Volume2, label: "Sonido" },
  applause: { icon: Hand, label: "Aplausos" },
  drum: { icon: Drum, label: "Tambor" },
  laugh: { icon: Laugh, label: "Risas" },
  bell: { icon: Bell, label: "Campana" },
  partyPopper: { icon: PartyPopper, label: "Fiesta" },
  trophy: { icon: Trophy, label: "Premio" },
  music: { icon: Music, label: "Música" },
  guitar: { icon: Guitar, label: "Guitarra" },
  mic: { icon: Mic, label: "Micrófono" },
  megaphone: { icon: Megaphone, label: "Megáfono" },
  siren: { icon: Siren, label: "Sirena" },
  sparkles: { icon: Sparkles, label: "Destello" },
  heart: { icon: Heart, label: "Corazón" },
};

export const DEFAULT_SOUND_ICON = "volume";

export const soundIconOf = (key: string): LucideIcon =>
  (SOUND_ICONS[key] ?? SOUND_ICONS[DEFAULT_SOUND_ICON]).icon;

export const soundEntry = (asset: Pick<MediaAsset, "id" | "title" | "soundIcon">): SoundEntry => ({
  id: asset.id,
  title: asset.title,
  icon: asset.soundIcon ?? DEFAULT_SOUND_ICON,
});
