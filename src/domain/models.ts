// Domain models shared by the whole app. They mirror the iPad app (IRIS_SPEC §9)
// so the API can serve both clients with the same shapes.

export type Id = string;

export type UserSession = {
  userId: Id;
  churchName: string;
  leaderName: string;
  email: string;
};

/** One projected screen of a song: optional section name + the text shown on the TV. */
export type SongSection = {
  id: Id;
  /** "Estrofa 1", "Coro"… Hidden when empty. */
  label: string | null;
  text: string;
};

export type Song = {
  id: Id;
  title: string;
  author: string;
  sections: SongSection[];
  updatedAt: string;
};

export type Person = {
  id: Id;
  name: string;
};

/** Church-wide feature switches. Letras is always on. */
export type ChurchModules = {
  bible: boolean;
  multimedia: boolean;
  timeControl: boolean;
};

export type ModuleKey = keyof ChurchModules;

export type ServiceSchedule = {
  /** 1 = Sunday … 7 = Saturday (same convention as the iPad app). */
  weekday: number;
  hour: number;
  minute: number;
};

export type BlockTemplate = {
  id: Id;
  name: string;
  plannedMinutes: number;
  defaultPersonId: Id | null;
};

export type ServiceType = {
  id: Id;
  name: string;
  /** "#RRGGBB", one of SERVICE_PALETTE. */
  color: string;
  schedule: ServiceSchedule | null;
  /** Empty when the service does not track time. */
  blocks: BlockTemplate[];
};

export type BlockRecordStatus = "completed" | "skipped" | "adjusted";

export type BlockRecord = {
  id: Id;
  name: string;
  plannedSeconds: number;
  actualSeconds: number;
  personId: Id | null;
  /** Name when the record was saved, so it stays readable after a rename or delete. */
  personName: string | null;
  status: BlockRecordStatus;
};

/** The saved timing of one service. Only times are stored, never the content used. */
export type ServiceRecord = {
  id: Id;
  date: string;
  serviceTypeId: Id;
  blocks: BlockRecord[];
};
