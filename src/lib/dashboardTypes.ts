export type DashboardSpot = {
  id: string;
  googlePlaceId: string;
  name: string;
  neighborhood: string | null;
  category: string;
  emoji: string | null;
  lat?: number | null;
  lng?: number | null;
  /** Anonym “plussa”; sorteras först i listan. */
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
