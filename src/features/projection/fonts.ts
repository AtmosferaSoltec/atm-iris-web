import {
  Bebas_Neue,
  Inter,
  Lora,
  Merriweather,
  Montserrat,
  Oswald,
  Playfair_Display,
  Poppins,
} from "next/font/google";

// The projection typefaces (src/domain/projection-fonts.ts), served by this site: a TV gets
// them from here, never from what it has installed. Not preloaded: a font file only
// downloads when a screen shows lyrics in it.

// next/font reads each call statically: the options are written out in full.
const inter = Inter({
  subsets: ["latin"],
  preload: false,
  display: "swap",
  variable: "--font-projection-inter",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  preload: false,
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-projection-montserrat",
});
const poppins = Poppins({
  subsets: ["latin"],
  preload: false,
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-projection-poppins",
});
const oswald = Oswald({
  subsets: ["latin"],
  preload: false,
  display: "swap",
  variable: "--font-projection-oswald",
});
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  preload: false,
  display: "swap",
  weight: "400",
  variable: "--font-projection-bebas",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  preload: false,
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-projection-playfair",
});
const lora = Lora({
  subsets: ["latin"],
  preload: false,
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-projection-lora",
});
const merriweather = Merriweather({
  subsets: ["latin"],
  preload: false,
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-projection-merriweather",
});

/** The CSS variables of every projection font, for the root element. */
export const projectionFontVariables = [
  inter,
  montserrat,
  poppins,
  oswald,
  bebasNeue,
  playfair,
  lora,
  merriweather,
]
  .map((font) => font.variable)
  .join(" ");
