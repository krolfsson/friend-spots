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

    "home.hero.lead":
      "Inga konton, inga onödiga integreringar (eller jo, en – Google Maps). Inga dashboards eller andra saker ni aldrig bad om.",
    "home.hero.sub":
      "Ni samlar era favoritställen på en karta, likear det ni gillar, lägger till fler städer när ni vill – och en pinkod så inte halva internet snubblar in av misstag. Och massa emojis.",
    "home.stats.line": "{count} tips sparade hittills.",
    "home.cta.create": "Skapa ny karta",
    "home.cta.open": "Öppna min karta",
    "home.step.back": "Tillbaka",
    "home.step.closeOverlayAria": "Stäng",
    "home.step.create.title": "Ny karta — nice!",
    "home.step.create.lede":
      "Välj ett namn som känns rätt (ni kan byta sen) och en pinkod som bara gänget fattar. Sen får ni en länk att slänga i chatten.",
    "home.step.create.pinHint":
      "Pinkoden är bara så inte helt random folk råkar in i er karta. Sparas som kaka i typ 90 dagar.",
    "home.step.mapNameLabel": "Namn på kartan",
    "home.step.open.title": "Välkommen tillbaka",
    "home.step.open.lede":
      "Skriv samma sista bit som i länken (t.ex. rolfsson om det står mapsies…/rolfsson) och er pinkod. Klart.",
    "home.step.open.slugLabel": "Sista biten av länken",
    "home.step.open.slugPlaceholder": "t.ex. rolfsson",
    "home.step.open.pinHint": "Samma pinkod som när kartan skapades — den som bara ni vet.",
    "home.step.open.submit": "Öppna kartan",

    "room.actions.newMap": "Skapa ny karta",
    "room.actions.shareMap": "Dela med vänner",
    "room.actions.directions": "Hitta",
    "room.view.map": "Karta",
    "room.view.list": "Topplista",
    "room.view.latest": "Senaste",
    "room.filter.allCategories": "Alla kategorier",

    "cat.frukost": "Frukost",
    "cat.lunch": "Lunch",
    "cat.middag": "Middag",
    "cat.fika": "Fika",
    "cat.bar": "Bar",
    "cat.pub": "Pub",
    "cat.klubb": "Klubb",
    "cat.sevardhet": "Sevärdhet",
    "cat.shopping": "Shopping",
    "cat.boende": "Boende",
    "cat.annat": "Annat",

    "share.copy":
      "Låt dina kompisar fylla i sina bästa tips, eller plussa tips som de håller med om.",
    "share.copiedToast": "Kopierat! Klistra in i iMessage/Facebook/valfri app.",
    "share.sheet.sms": "SMS / iMessage",
    "share.sheet.whatsapp": "WhatsApp",
    "share.sheet.facebook": "Facebook",
    "share.sheet.email": "E-post",
    "share.sheet.copy": "Kopiera länk",
    "share.sheet.close": "Stäng",

    "rename.title": "Byt kartnamn",
    "rename.subtitle": "Länken ändras inte. Bara namnet.",
    "rename.save": "Spara",
    "rename.saving": "Sparar…",
    "rename.successToast": "Kartnamn uppdaterat.",
    "rename.errorDefault": "Kunde inte spara namn",

    "add.title": "Nytt tips",
    "add.cityLabel": "Stad",
    "add.placeCategoryLabel": "Plats & kategorier",
    "add.searchPlaceholder": "Sök upp ditt tips",
    "add.save": "Spara",
    "add.saving": "Sparar…",
    "add.savedToast": "Sparat ✨",

    "edit.title": "Redigera tips",
    "edit.categoryLabel": "Kategorier",

    "common.close": "Stäng",
    "common.cancel": "Avbryt",

    "spots.loadError": "Kunde inte ladda tips",
    "spots.saveError": "Kunde inte spara",
    "spots.deleteConfirm": "Ta bort detta tips permanent?",
    "spots.deleteError": "Kunde inte ta bort tipset.",
    "spots.pointsAria.remove": "Poäng {score}, tryck för att ta bort din +1",
    "spots.pointsAria.add": "Poäng {score}, tryck +1 för att höja",
    "spots.plusAria.remove": "Ta bort din +1",
    "spots.plusAria.add": "Lägg till +1 i poäng",
    "spots.menu.close": "Stäng meny",
    "spots.menu.delete": "Ta bort",
    "spots.menu.edit": "Redigera",
    "spots.actionsMenuAria": "Redigera eller ta bort tips",

    "add.closeAria": "Stäng lägg till",

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

    "home.hero.lead":
      "No accounts, no pointless integrations (okay, one — Google Maps). No dashboards or anything else you never asked for.",
    "home.hero.sub":
      "You save your favorite spots on one map, like what you like, add more cities whenever you want — and a PIN so half the internet doesn’t stumble in by mistake. And tons of emojis.",
    "home.stats.line": "{count} tips saved so far.",
    "home.cta.create": "Create a new map",
    "home.cta.open": "Open my map",
    "home.step.back": "Back",
    "home.step.closeOverlayAria": "Close",
    "home.step.create.title": "New map — let’s go",
    "home.step.create.lede":
      "Pick a name that feels right (you can change it later) and a PIN your crew will remember. You’ll get a link to drop in the group chat.",
    "home.step.create.pinHint":
      "The PIN keeps random strangers from wandering into your map. Saved as a cookie for ~90 days.",
    "home.step.mapNameLabel": "Map name",
    "home.step.open.title": "Welcome back",
    "home.step.open.lede":
      "Type the last part of your link (e.g. rolfsson if it’s mapsies…/rolfsson) and your PIN. That’s it.",
    "home.step.open.slugLabel": "Last part of the link",
    "home.step.open.slugPlaceholder": "e.g. rolfsson",
    "home.step.open.pinHint": "Same PIN as when the map was made — the one only you lot know.",
    "home.step.open.submit": "Open map",

    "room.actions.newMap": "Create new map",
    "room.actions.shareMap": "Share with friends",
    "room.actions.directions": "Directions",
    "room.view.map": "Map",
    "room.view.list": "Leaderboard",
    "room.view.latest": "Latest",
    "room.filter.allCategories": "All categories",

    "cat.frukost": "Breakfast",
    "cat.lunch": "Lunch",
    "cat.middag": "Dinner",
    "cat.fika": "Coffee",
    "cat.bar": "Bar",
    "cat.pub": "Pub",
    "cat.klubb": "Club",
    "cat.sevardhet": "Sight",
    "cat.shopping": "Shopping",
    "cat.boende": "Stay",
    "cat.annat": "Other",

    "share.copy":
      "Let your friends add their best tips, or +1 tips they especially agree with.",
    "share.copiedToast": "Copied! Paste into iMessage/Facebook/any app.",
    "share.sheet.sms": "SMS / iMessage",
    "share.sheet.whatsapp": "WhatsApp",
    "share.sheet.facebook": "Facebook",
    "share.sheet.email": "Email",
    "share.sheet.copy": "Copy link",
    "share.sheet.close": "Close",

    "rename.title": "Rename map",
    "rename.subtitle": "The link won’t change. Only the name.",
    "rename.save": "Save",
    "rename.saving": "Saving…",
    "rename.successToast": "Map name updated.",
    "rename.errorDefault": "Could not save name",

    "add.title": "New tip",
    "add.cityLabel": "City",
    "add.placeCategoryLabel": "Place & categories",
    "add.searchPlaceholder": "Search for your tip",
    "add.save": "Save",
    "add.saving": "Saving…",
    "add.savedToast": "Saved ✨",

    "edit.title": "Edit tip",
    "edit.categoryLabel": "Categories",

    "common.close": "Close",
    "common.cancel": "Cancel",

    "spots.loadError": "Could not load tips",
    "spots.saveError": "Could not save",
    "spots.deleteConfirm": "Delete this tip permanently?",
    "spots.deleteError": "Could not delete the tip.",
    "spots.pointsAria.remove": "Score {score}, tap to remove your +1",
    "spots.pointsAria.add": "Score {score}, tap +1 to increase",
    "spots.plusAria.remove": "Remove your +1",
    "spots.plusAria.add": "Add +1 to score",
    "spots.menu.close": "Close menu",
    "spots.menu.delete": "Delete",
    "spots.menu.edit": "Edit",
    "spots.actionsMenuAria": "Edit or delete tip",

    "add.closeAria": "Close add tip",

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

/** Ersätter `{namn}` i meddelandesträngar, t.ex. `{count}`. */
export function tReplace(locale: Locale, key: string, vars: Record<string, string | number>): string {
  let s = t(locale, key);
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

export function localeCookieName() {
  return LOCALE_COOKIE;
}

