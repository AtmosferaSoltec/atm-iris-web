import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { IrisBackground } from "@/components/brand/iris-background";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "Iris", template: "%s · Iris" },
  description: "Prepara las letras, los servicios y los equipos de tu iglesia.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#07070B",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${newsreader.variable} h-full`}>
      <body className="min-h-full">
        <IrisBackground />
        {children}
      </body>
    </html>
  );
}
