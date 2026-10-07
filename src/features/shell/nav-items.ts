import {
  Clapperboard,
  House,
  ImagePlay,
  Library,
  Music,
  Quote,
  Settings2,
  Timer,
  Users,
} from "lucide-react";
import type { Route } from "next";
import type { ModuleKey } from "@/domain/models";

export type NavItem = {
  href: Route;
  label: string;
  icon: typeof House;
  /** Only shown when the church has this module on. */
  module?: ModuleKey;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/letras", label: "Letras", icon: Quote },
  { href: "/musica", label: "Música", icon: Music, module: "multimedia" },
  { href: "/multimedia", label: "Multimedia", icon: Clapperboard, module: "multimedia" },
  { href: "/fondos", label: "Fondos", icon: ImagePlay, module: "multimedia" },
  { href: "/servicios", label: "Servicios", icon: Library },
  { href: "/personas", label: "Personas", icon: Users, module: "timeControl" },
  { href: "/tiempos", label: "Tiempos", icon: Timer, module: "timeControl" },
  { href: "/ajustes", label: "Ajustes", icon: Settings2 },
];
