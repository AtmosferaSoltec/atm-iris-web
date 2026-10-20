import {
  Clapperboard,
  House,
  ImagePlay,
  Library,
  Music,
  Presentation,
  Settings2,
  Timer,
  Users,
} from "lucide-react";
import type { Route } from "next";

export type NavItem = {
  href: Route;
  label: string;
  icon: typeof House;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/console", label: "Iniciar servicio", icon: Presentation },
  { href: "/songs", label: "Canciones", icon: Music },
  { href: "/media", label: "Multimedia", icon: Clapperboard },
  { href: "/backgrounds", label: "Fondos", icon: ImagePlay },
  { href: "/services", label: "Servicios", icon: Library },
  { href: "/people", label: "Personas", icon: Users },
  { href: "/times", label: "Tiempos", icon: Timer },
  { href: "/settings", label: "Ajustes", icon: Settings2 },
];
