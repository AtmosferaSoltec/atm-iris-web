import {
  Clapperboard,
  House,
  Library,
  ListMusic,
  Settings2,
  Timer,
  UserRoundCog,
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
  { href: "/canciones", label: "Canciones", icon: ListMusic },
  { href: "/multimedia", label: "Multimedia", icon: Clapperboard, module: "multimedia" },
  { href: "/servicios", label: "Servicios", icon: Library },
  { href: "/personas", label: "Personas", icon: Users, module: "timeControl" },
  { href: "/tiempos", label: "Tiempos", icon: Timer, module: "timeControl" },
  { href: "/equipo", label: "Equipo", icon: UserRoundCog },
  { href: "/ajustes", label: "Ajustes", icon: Settings2 },
];
