export type Locale = "sv" | "en";

const LOCALE_COOKIE = "mapsies_locale";

export function pickLocaleFromAcceptLanguage(acceptLanguage: string | null | undefined): Locale {
  const raw = (acceptLanguage ?? "").toLowerCase();
  // Prefer Swedish if it appears anywhere in the weighted list.
  if (raw.includes("sv")) return "sv";
  return "en";
}

export const MESSAGES: Record<Locale, Record<string, string>> = {
  sv: {
    "home.title": "Skapa en karta med kompisgänget",
    "home.lede":
      "Skapa en länk, dela den i gruppchatten och fyll kartan med era favoritplatser och tips. Välj en pinkod så att nya webbläsare kan låsa upp kartan (inloggningen sparas som kaka i upp till 90 dagar).",
    "home.create.nameLabel": "Namn (du kan ändra detta senare)",
    "home.create.namePlaceholder": "t.ex. Bucketlist 4 Lyfe",
    "home.create.pinLabel": "Pinkod",
    "home.create.pinPlaceholder": "t.ex. 1234",
    "home.create.cta": "Skapa karta",
    "home.open.title": "Har du redan en karta?",
    "home.open.placeholder": "t.ex. /rolfsson",
    "home.open.cta": "Öppna karta",

    "room.actions.newMap": "Ny karta",
    "room.actions.shareMap": "Dela karta",

    "unlock.lede": "Ange pinkod för att öppna kartan.",
    "unlock.pinLabel": "Pinkod",
    "unlock.cta": "Öppna kartan",
    "unlock.ctaBusy": "Öppnar…",
    "unlock.createLink": "Skapa egen karta",
    "unlock.errorDefault": "Kunde inte låsa upp",
  },
  en: {
    "home.title": "Make a map with friends",
    "home.lede":
      "Create a link, share it in the group chat, and fill the map with your favorite places and tips. Choose a PIN so new browsers can unlock the map (sign-in is saved as a cookie for up to 90 days).",
    "home.create.nameLabel": "Name (you can change this later)",
    "home.create.namePlaceholder": "e.g. Bucketlist 4 Lyfe",
    "home.create.pinLabel": "PIN",
    "home.create.pinPlaceholder": "e.g. 1234",
    "home.create.cta": "Create map",
    "home.open.title": "Already have a map?",
    "home.open.placeholder": "e.g. /rolfsson",
    "home.open.cta": "Open map",

    "room.actions.newMap": "New map",
    "room.actions.shareMap": "Share map",

    "unlock.lede": "Enter the PIN to open the map.",
    "unlock.pinLabel": "PIN",
    "unlock.cta": "Open map",
    "unlock.ctaBusy": "Opening…",
    "unlock.createLink": "Create a map",
    "unlock.errorDefault": "Could not unlock",
  },
};

export function t(locale: Locale, key: string): string {
  return MESSAGES[locale]?.[key] ?? MESSAGES.sv[key] ?? key;
}

export function localeCookieName() {
  return LOCALE_COOKIE;
}

