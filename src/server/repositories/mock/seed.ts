import type {
  BlockRecord,
  Church,
  Person,
  ServiceRecord,
  ServiceType,
  Song,
} from "@/domain/models";
import { parseLyrics } from "@/lib/lyrics";
import type { ChurchData } from "./world";

// Same sample church as the iPad app (IRIS_SPEC §11). Hymn texts are public domain.

const PEOPLE_NAMES = [
  "Daniel Ruiz",
  "Ana Torres",
  "Carlos Pérez",
  "Lucía Gómez",
  "Marta Rivas",
  "José Herrera",
  "Sofía Méndez",
  "Pablo Castro",
];

const SONGS: { title: string; author: string; lyrics: string }[] = [
  {
    title: "Oh, qué amigo nos es Cristo",
    author: "Joseph M. Scriven",
    lyrics:
      "#Estrofa 1\n¡Oh, qué amigo nos es Cristo!\nÉl llevó nuestro dolor,\ny nos manda que llevemos\ntodo a Dios en oración.",
  },
  {
    title: "Roca de la eternidad",
    author: "Augustus M. Toplady",
    lyrics:
      "#Estrofa 1\nRoca de la eternidad,\nfuiste abierta tú por mí;\nsé mi escondedero fiel,\nsolo encuentro paz en ti.",
  },
  {
    title: "Cariñoso Salvador",
    author: "Charles Wesley",
    lyrics:
      "#Estrofa 1\nCariñoso Salvador,\nhuyo de la tempestad\na tu seno protector,\nfiándome de tu bondad.",
  },
  {
    title: "Sublime gracia",
    author: "John Newton",
    lyrics: [
      "#Estrofa 1\nSublime gracia del Señor\nque a un pecador salvó;\nfui ciego mas hoy veo yo,\nperdido y Él me halló.",
      "#Estrofa 2\nSu gracia me enseñó a temer,\nmis dudas ahuyentó;\n¡oh cuán precioso fue a mi ser\ncuando Él me transformó!",
      "#Estrofa 3\nEn los peligros o aflicción\nque yo he tenido aquí,\nsu gracia siempre me libró\ny me guiará feliz.",
      "#Estrofa 4\nY cuando en Sion por siglos mil\nbrillando esté cual sol,\nyo cantaré por siempre allí\nsu amor que me salvó.",
    ].join("\n\n"),
  },
  {
    title: "Santo, santo, santo",
    author: "Reginald Heber",
    lyrics:
      "#Estrofa 1\n¡Santo, santo, santo! Señor omnipotente,\nsiempre el labio mío loores te dará;\n¡Santo, santo, santo! te adoro reverente,\nDios en tres personas, bendita Trinidad.",
  },
  {
    title: "Castillo fuerte",
    author: "Martín Lutero",
    lyrics:
      "Castillo fuerte es nuestro Dios,\ndefensa y buen escudo;\ncon su poder nos librará\nen este trance agudo.",
  },
];

/** "Culto general" blocks: planned minutes and who led each one in the sample records. */
const CULTO_BLOCKS = [
  { name: "Bienvenida", minutes: 10, leader: "Carlos Pérez" },
  { name: "Alabanzas", minutes: 15, leader: "Ana Torres" },
  { name: "Prédica", minutes: 40, leader: "Daniel Ruiz" },
  { name: "Anuncios", minutes: 5, leader: "Lucía Gómez" },
];

type Sample = [leader: string, minutes: number, seconds: number, status?: "adjusted"] | null;

/**
 * The iPad's sample records (MockChurchData.swift), block by block, so the
 * summaries can be compared figure by figure. `null` is a skipped block.
 */
const RECORD_SAMPLES: Sample[][] = [
  [
    ["Carlos Pérez", 9, 40],
    ["Ana Torres", 19, 5],
    ["Daniel Ruiz", 51, 30],
    ["Lucía Gómez", 5, 55],
  ],
  [
    ["Marta Rivas", 11, 12],
    ["Ana Torres", 14, 30],
    ["Daniel Ruiz", 44, 10],
    ["Lucía Gómez", 4, 40],
  ],
  [
    ["Carlos Pérez", 8, 50],
    ["José Herrera", 16, 20],
    ["Pablo Castro", 38, 45],
    ["Lucía Gómez", 6, 15],
  ],
  [
    ["Carlos Pérez", 10, 5],
    ["Ana Torres", 16, 40],
    ["Daniel Ruiz", 47, 20],
    ["Lucía Gómez", 5, 10],
  ],
  [["Marta Rivas", 9, 30], ["José Herrera", 15, 0], ["Daniel Ruiz", 42, 15], null],
  [
    ["Carlos Pérez", 11, 45],
    ["Ana Torres", 18, 20],
    ["Pablo Castro", 39, 50, "adjusted"],
    ["Sofía Méndez", 4, 50],
  ],
  [
    ["José Herrera", 9, 55],
    ["Ana Torres", 14, 10],
    ["Daniel Ruiz", 53, 5],
    ["Lucía Gómez", 7, 20],
  ],
  [
    ["Carlos Pérez", 8, 40],
    ["José Herrera", 17, 30],
    ["Daniel Ruiz", 40, 0],
    ["Marta Rivas", 5, 0],
  ],
  [
    ["Marta Rivas", 12, 10],
    ["Ana Torres", 15, 45],
    ["Pablo Castro", 44, 30],
    ["Lucía Gómez", 6, 5],
  ],
  [
    ["Carlos Pérez", 9, 50],
    ["Ana Torres", 20, 15],
    ["Daniel Ruiz", 49, 40],
    ["Lucía Gómez", 5, 30],
  ],
];

const GIB = 1024 * 1024 * 1024;

export function newChurch(id: string, name: string, now: Date): Church {
  const timestamp = now.toISOString();
  return {
    id,
    name,
    timezone: "America/Lima",
    modules: { bible: true, multimedia: true, timeControl: true },
    storage: { usedBytes: 0, quotaBytes: 5 * GIB },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function emptyChurchData(church: Church): ChurchData {
  return {
    church,
    people: [],
    serviceTypes: [],
    songs: [],
    media: [],
    uploads: [],
    records: [],
  };
}

export function sampleSongs(now: Date, titles?: string[]): Song[] {
  const timestamp = now.toISOString();
  return SONGS.filter((song) => !titles || titles.includes(song.title)).map((song, index) => ({
    id: crypto.randomUUID(),
    title: song.title,
    author: song.author,
    sections: parseLyrics(song.lyrics).map((section) => ({ id: crypto.randomUUID(), ...section })),
    createdAt: timestamp,
    // Spread a little so "Recientes" has an order.
    updatedAt: new Date(now.getTime() - index * 86_400_000).toISOString(),
  }));
}

/** People, three service types and the last 10 Sundays of "Culto general". */
export function sampleContent(
  now: Date,
): Pick<ChurchData, "people" | "serviceTypes" | "songs" | "records"> {
  const id = () => crypto.randomUUID();
  const timestamp = now.toISOString();
  const people: Person[] = PEOPLE_NAMES.map((name) => ({
    id: id(),
    name,
    blockCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
  const personId = (name: string) => people.find((p) => p.name === name)?.id ?? null;

  const culto: ServiceType = {
    id: id(),
    name: "Culto general",
    color: "#FFB547",
    schedule: { weekday: 1, hour: 10, minute: 0 },
    blocks: CULTO_BLOCKS.map((block) => ({
      id: id(),
      name: block.name,
      plannedMinutes: block.minutes,
    })),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const serviceTypes: ServiceType[] = [
    { ...culto },
    {
      id: id(),
      name: "Jóvenes",
      color: "#F0508C",
      schedule: { weekday: 7, hour: 19, minute: 0 },
      blocks: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: id(),
      name: "ABC",
      color: "#9B5CFF",
      schedule: { weekday: 1, hour: 9, minute: 0 },
      blocks: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  const today = startOfLimaDay(now);
  const records = RECORD_SAMPLES.map((samples, index): ServiceRecord => {
    const iso = new Date(today - 7 * (index + 1) * 86_400_000).toISOString();
    const blocks = CULTO_BLOCKS.map((template, position): BlockRecord => {
      const sample = samples[position];
      return {
        id: id(),
        name: template.name,
        plannedSeconds: template.minutes * 60,
        actualSeconds: sample ? sample[1] * 60 + sample[2] : 0,
        personId: sample ? personId(sample[0]) : null,
        personName: sample ? sample[0] : null,
        status: !sample ? "skipped" : (sample[3] ?? "completed"),
      };
    });
    return {
      id: id(),
      date: iso,
      serviceTypeId: culto.id,
      serviceTypeName: culto.name,
      blocks,
      createdAt: iso,
      updatedAt: iso,
    };
  });

  return { people, serviceTypes, songs: sampleSongs(now), records };
}

/** Midnight of `now`'s day in Lima (UTC−5 all year), like the iPad's `startOfDay`. */
function startOfLimaDay(now: Date): number {
  const lima = new Date(now.getTime() - 5 * 3_600_000);
  return Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), lima.getUTCDate(), 5);
}
