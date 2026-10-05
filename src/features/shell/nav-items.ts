import { House, Library, ListMusic, Settings2, Users } from "lucide-react";
import type { Route } from "next";

export type NavItem = {
  href: Route;
  label: string;
  icon: typeof House;
  /** Only shown when the church has the time-control module on. */
  requiresTimeControl?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/canciones", label: "Canciones", icon: ListMusic },
  { href: "/servicios", label: "Servicios", icon: Library },
  { href: "/personas", label: "Personas", icon: Users, requiresTimeControl: true },
  { href: "/modulos", label: "Módulos", icon: Settings2 },
];
