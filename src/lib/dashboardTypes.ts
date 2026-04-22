export type DashboardSpot = {
  id: string;
  googlePlaceId: string;
  name: string;
  neighborhood: string | null;
  categories: string[];
  emoji: string | null;
  lat?: number | null;
  lng?: number | null;
  /** ISO-tid när tipset skapades (för “Det senaste”-sortering). */
  createdAt: string;
  /** Anonym “plussa”; listan sorteras efter detta (sedan namn). */
  plusCount: number;
  /** Sätts när klienten skickar X-Voter-Token (samma webbläsare har redan plussat). */
  viewerHasPlussed?: boolean;
  recommendations: { id: string; contributorName: string }[];
};

export type CityBundle = {
  spots: DashboardSpot[];
  categoryCounts: Record<string, number>;
};

export type DashboardBySlug = Record<string, CityBundle>;
