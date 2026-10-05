import type {
  BlockRecord,
  ChurchModules,
  Person,
  ServiceRecord,
  ServiceType,
  Song,
} from "@/domain/models";
import { parseLyrics } from "@/lib/lyrics";

// Same sample data as the iPad app (IRIS_SPEC §11). Hymn texts are public domain.

export type ChurchData = {
  modules: ChurchModules;
  songs: Song[];
  people: Person[];
  serviceTypes: ServiceType[];
  records: ServiceRecord[];
};

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
      "[Estrofa 1]\n¡Oh, qué amigo nos es Cristo!\nÉl llevó nuestro dolor,\ny nos manda que llevemos\ntodo a Dios en oración.",
  },
  {
    title: "Roca de la eternidad",
    author: "Augustus M. Toplady",
    lyrics:
      "[Estrofa 1]\nRoca de la eternidad,\nfuiste abierta tú por mí;\nsé mi escondedero fiel,\nsolo encuentro paz en ti.",
  },
  {
    title: "Cariñoso Salvador",
    author: "Charles Wesley",
    lyrics:
      "[Estrofa 1]\nCariñoso Salvador,\nhuyo de la tempestad\na tu seno protector,\nfiándome de tu bondad.",
  },
  {
    title: "Sublime gracia",
    author: "John Newton",
    lyrics: [
      "[Estrofa 1]\nSublime gracia del Señor\nque a un pecador salvó;\nfui ciego mas hoy veo yo,\nperdido y Él me halló.",
      "[Estrofa 2]\nSu gracia me enseñó a temer,\nmis dudas ahuyentó;\n¡oh cuán precioso fue a mi ser\ncuando Él me transformó!",
      "[Estrofa 3]\nEn los peligros o aflicción\nque yo he tenido aquí,\nsu gracia siempre me libró\ny me guiará feliz.",
      "[Estrofa 4]\nY cuando en Sion por siglos mil\nbrillando esté cual sol,\nyo cantaré por siempre allí\nsu amor que me salvó.",
    ].join("\n\n"),
  },
  {
    title: "Santo, santo, santo",
    author: "Reginald Heber",
    lyrics:
      "[Estrofa 1]\n¡Santo, santo, santo! Señor omnipotente,\nsiempre el labio mío loores te dará;\n¡Santo, santo, santo! te adoro reverente,\nDios en tres personas, bendita Trinidad.",
  },
  {
    title: "Castillo fuerte",
    author: "Martín Lutero",
    lyrics:
      "Castillo fuerte es nuestro Dios,\ndefensa y buen escudo;\ncon su poder nos librará\nen este trance agudo.",
  },
];

/** Planned minutes and last-Sunday actual times for "Culto general". */
const CULTO_BLOCKS = [
  { name: "Bienvenida", minutes: 10, leader: "Carlos Pérez", lastWeek: 9 * 60 + 40 },
  { name: "Alabanzas", minutes: 15, leader: "Ana Torres", lastWeek: 19 * 60 + 5 },
  { name: "Prédica", minutes: 40, leader: "Daniel Ruiz", lastWeek: 51 * 60 + 30 },
  { name: "Anuncios", minutes: 5, leader: "Lucía Gómez", lastWeek: 5 * 60 + 55 },
];

export function createSeed(now = new Date()): ChurchData {
  const id = () => crypto.randomUUID();
  const people: Person[] = PEOPLE_NAMES.map((name) => ({ id: id(), name }));
  const personId = (name: string) => people.find((p) => p.name === name)?.id ?? null;

  const songs: Song[] = SONGS.map((song) => ({
    id: id(),
    title: song.title,
    author: song.author,
    sections: parseLyrics(song.lyrics).map((section) => ({ id: id(), ...section })),
    updatedAt: now.toISOString(),
  }));

  const culto: ServiceType = {
    id: id(),
    name: "Culto general",
    color: "#FFB547",
    schedule: { weekday: 1, hour: 10, minute: 0 },
    blocks: CULTO_BLOCKS.map((block) => ({
      id: id(),
      name: block.name,
      plannedMinutes: block.minutes,
      defaultPersonId: personId(block.leader),
    })),
  };

  const serviceTypes: ServiceType[] = [
    culto,
    {
      id: id(),
      name: "Jóvenes",
      color: "#F0508C",
      schedule: { weekday: 7, hour: 19, minute: 0 },
      blocks: [],
    },
    {
      id: id(),
      name: "ABC",
      color: "#9B5CFF",
      schedule: { weekday: 1, hour: 9, minute: 0 },
      blocks: [],
    },
  ];

  const records = lastSundays(now, 10).map((date, weeksAgo): ServiceRecord => {
    const blocks = CULTO_BLOCKS.map((block, index): BlockRecord => {
      // Rotate leaders a little so the people list has varied counts.
      const leader =
        weeksAgo % 3 === 2 ? PEOPLE_NAMES[(index + weeksAgo) % PEOPLE_NAMES.length] : block.leader;
      const drift = ((weeksAgo * 37 + index * 53) % 240) - 90;
      const skipped = weeksAgo === 4 && block.name === "Anuncios";
      return {
        id: id(),
        name: block.name,
        plannedSeconds: block.minutes * 60,
        actualSeconds: skipped
          ? 0
          : weeksAgo === 0
            ? block.lastWeek
            : Math.max(60, block.minutes * 60 + drift),
        personId: personId(leader),
        personName: leader,
        status: skipped
          ? "skipped"
          : weeksAgo === 5 && block.name === "Prédica"
            ? "adjusted"
            : "completed",
      };
    });
    return { id: id(), date: date.toISOString(), serviceTypeId: culto.id, blocks };
  });

  return {
    modules: { bible: true, multimedia: true, timeControl: true },
    songs,
    people,
    serviceTypes,
    records,
  };
}

/** The `count` Sundays before `now`, most recent first, at 10:00. */
function lastSundays(now: Date, count: number): Date[] {
  const sunday = new Date(now);
  sunday.setHours(10, 0, 0, 0);
  sunday.setDate(sunday.getDate() - (sunday.getDay() === 0 ? 7 : sunday.getDay()));
  return Array.from({ length: count }, (_, weeksAgo) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() - weeksAgo * 7);
    return date;
  });
}
