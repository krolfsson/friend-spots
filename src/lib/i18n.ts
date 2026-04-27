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
    "home.title": "Skapa en mapsie med kompisgänget",
    "home.lede":
      "Skapa en länk och fyll mapsien med favoritställen och tips. Pinkoden är för er som ska kunna lägga till och ändra — den som har den kan fylla i, likea och redigera. Ni kan också låta vem som helst med länken bara läsa (read only); det slår ni på under kartans inställningar (kugghjulet vid namnet) efter att mapsien skapats. Pinkinloggning sparas som kaka i upp till 90 dagar.",
    "home.create.nameLabel": "Namn (du kan ändra detta senare)",
    "home.create.namePlaceholder": "t.ex. Bucketlist 4 Lyfe",
    "home.create.pinLabel": "Pinkod",
    "home.create.pinPlaceholder": "t.ex. 1234",
    "home.create.cta": "Skapa mapsie",
    "home.create.ctaBusy": "Skapar…",
    "home.open.title": "Har du redan en mapsie?",
    "home.open.placeholder": "t.ex. /alla-mina-kompisars-tips",
    "home.open.cta": "Öppna mapsie",

    "home.hero.lead":
      "Inga konton, inga onödiga integreringar (eller ok, en – Google Maps). Inga dashboards eller andra saker ni aldrig bad om.",
    "home.hero.sub":
      "Pinkod för gänget som ska fylla i kartan; dela gärna en läslänk till andra. Read only och övrigt ställer ni in under inställningarna efter att mapsien skapats.",
    "home.stats.line": "{count} tips sparade hittills.",
    "home.footer.guideDeladKarta": "Guide: delad karta",
    "home.footer.guideSharedMap": "Guide: shared map (EN)",
    "home.footer.copyright": "Mapsies © 2026",
    "home.cta.create": "Skapa ny mapsie",
    "home.cta.open": "Öppna min mapsie",
    "home.mockup.caption": "Mac i mitten, två iPhones — byt till era skärmdumpar när de ligger i public/.",
    "home.mockup.placeholderDesktop": "Mac-skärm",
    "home.mockup.placeholderPhone": "iPhone-skärm",
    "home.step.back": "Tillbaka",
    "home.step.closeOverlayAria": "Stäng",
    "home.step.create.title": "Ny mapsie — nice!",
    "home.step.create.lede":
      "Välj namn och pinkod som bara ni som ska bidra ska veta — den som har pinkoden kan lägga till tips, likea och ändra. Sen får ni en länk till chatten. Ska fler bara få titta? Slå på läsläge under inställningar (kugghjulet vid kartnamnet) när mapsien finns.",
    "home.step.create.pinHint":
      "Pinkoden låser upp skrivläge för er som bygger mapsien. Utan pinkod kan ni ändå låta folk bara läsa om ni aktiverar det i inställningarna efter skapandet. Kakan håller i ungefär 90 dagar.",
    "home.step.mapNameLabel": "Namn på mapsien",
    "home.step.open.title": "Välkommen tillbaka",
    "home.step.open.lede":
      "Skriv samma sista bit som i länken (t.ex. alla-mina-kompisars-tips om länken slutar på …/alla-mina-kompisars-tips) och er pinkod. Klart.",
    "home.step.open.slugLabel": "Sista biten av länken",
    "home.step.open.slugPlaceholder": "t.ex. alla-mina-kompisars-tips",
    "home.step.open.pinHint": "Samma pinkod som när mapsien skapades — den som bara ni vet.",
    "home.step.open.submit": "Öppna mapsien",

    "room.actions.newMap": "Skapa ny mapsie",
    "room.actions.shareMap": "Dela med vänner",
    "room.actions.directions": "Hitta",
    "room.view.map": "Karta",
    "room.view.list": "Topplista",
    "room.view.latest": "Senaste",
    "room.filter.allCategories": "Alla kategorier",
    "room.city.createCta": "Skapa",
    "room.city.addCta": "Lägg till",
    "room.city.addBusy": "Lägger till…",
    "room.city.namePlaceholder": "Stad",
    "room.city.nameAria": "Stadens namn",
    "room.city.emojiAria": "Stad-emoji eller flagga",
    "room.city.detailsNamePlaceholder": "Namn på ny stad",
    "room.city.emptyLead": "Inga städer i den här mapsien än — skapa den första.",
    "room.city.createError": "Kunde inte skapa stad",
    "room.city.missingSlug": "Saknar stad",
    "room.city.unknownError": "Okänt fel",
    "room.city.editTitle": "Redigera stad",
    "room.city.editSave": "Spara",
    "room.city.editSaving": "Sparar…",
    "room.city.editNamePlaceholder": "Stadens namn",
    "room.city.editEmojiPlaceholder": "🌍",
    "room.city.editError": "Kunde inte spara",
    "room.city.deleteCta": "Radera stad…",
    "room.city.deleteBusy": "Raderar…",
    "room.city.deleteError": "Kunde inte radera stad",
    "room.city.deleteConfirm": "Radera \"{name}\" och alla tips i staden? Det går inte att ångra.",
    "room.city.deleteSuccessToast": "Staden är raderad",

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
    "cat.annat": "Gå inte hit",

    "share.copy":
      "Låt dina kompisar fylla i sina bästa tips, eller plussa tips som de håller med om.",
    "share.copiedToast": "Kopierat! Klistra in i iMessage/Facebook/valfri app.",
    "share.sheet.sms": "SMS / iMessage",
    "share.sheet.whatsapp": "WhatsApp",
    "share.sheet.facebook": "Facebook",
    "share.sheet.email": "E-post",
    "share.sheet.copy": "Kopiera länk",
    "share.sheet.close": "Stäng",

    "rename.title": "Döp om mapsien",
    "rename.subtitle": "Länken ändras inte. Bara namnet.",
    "rename.save": "Spara",
    "rename.saving": "Sparar…",
    "rename.successToast": "Namn uppdaterat.",
    "rename.errorDefault": "Kunde inte spara namn",
    "rename.publicReadLabel": "Alla med länken kan se (läsning)",
    "rename.publicReadHint":
      "Gäster ser karta och listor utan PIN. För att likea eller lägga till tips krävs fortfarande pinkod.",
    "rename.settingsSavedToast": "Inställningar sparade.",

    "room.publicUnlock.lede": "Ange pinkod för att likea, lägga till tips eller ändra mapsien.",
    "room.publicEmptyGuest": "Den här mapsien har inga städer ännu.",
    "room.publicEmptyGuestHint": "Skapa den första staden med pinkod nedan.",
    "room.guestBanner":
      "Du tittar som gäst — kartan och listorna är skrivskyddade. Ange pinkod när du vill bidra.",

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

    "unlock.lede": "Ange pinkod för att öppna mapsien.",
    "unlock.pinLabel": "Pinkod",
    "unlock.cta": "Öppna mapsien",
    "unlock.ctaBusy": "Öppnar…",
    "unlock.createLink": "Skapa egen mapsie",
    "unlock.errorDefault": "Kunde inte låsa upp",
  },
  en: {
    "home.title": "Make a mapsie with friends",
    "home.lede":
      "Create a link and fill your mapsie with favorite spots and tips. The PIN is for people who should be able to add and edit — anyone with it can fill in, like, and change things. You can also let anyone with the link view only (read-only); turn that on in the mapsie settings (gear next to the name) after it’s created. Unlocking is saved as a cookie for up to 90 days.",
    "home.create.nameLabel": "Name (you can change this later)",
    "home.create.namePlaceholder": "e.g. Bucketlist 4 Lyfe",
    "home.create.pinLabel": "PIN",
    "home.create.pinPlaceholder": "e.g. 1234",
    "home.create.cta": "Create mapsie",
    "home.create.ctaBusy": "Creating…",
    "home.open.title": "Already have a mapsie?",
    "home.open.placeholder": "e.g. /all-my-friends-tips",
    "home.open.cta": "Open mapsie",

    "home.hero.lead":
      "No accounts, no pointless integrations (okay, one — Google Maps). No dashboards or anything else you never asked for.",
    "home.hero.sub":
      "A PIN for the crew who contribute; share a read-only link with others. Read-only and more are in settings after the mapsie exists.",
    "home.stats.line": "{count} tips saved so far.",
    "home.footer.guideDeladKarta": "Guide: delad karta (SV)",
    "home.footer.guideSharedMap": "Guide: shared map",
    "home.footer.copyright": "Mapsies © 2026",
    "home.cta.create": "Create a new mapsie",
    "home.cta.open": "Open my mapsie",
    "home.mockup.caption": "Mac in the center, two iPhones — swap in screenshots from public/ when ready.",
    "home.mockup.placeholderDesktop": "Mac screen",
    "home.mockup.placeholderPhone": "iPhone screen",
    "home.step.back": "Back",
    "home.step.closeOverlayAria": "Close",
    "home.step.create.title": "New mapsie — let’s go",
    "home.step.create.lede":
      "Pick a name and a PIN only people who should contribute should know — anyone with the PIN can add tips, like, and edit. Then you get a link for the chat. Want others to view only? Turn on read-only in settings (gear next to the mapsie name) once the mapsie exists.",
    "home.step.create.pinHint":
      "The PIN unlocks edit mode for people building the mapsie. Without a PIN, you can still let people view only if you enable it in settings after you create it. The cookie lasts about 90 days.",
    "home.step.mapNameLabel": "Mapsie name",
    "home.step.open.title": "Welcome back",
    "home.step.open.lede":
      "Type the last part of your link (e.g. all-my-friends-tips if the URL ends with …/all-my-friends-tips) and your PIN. That’s it.",
    "home.step.open.slugLabel": "Last part of the link",
    "home.step.open.slugPlaceholder": "e.g. all-my-friends-tips",
    "home.step.open.pinHint": "Same PIN as when the mapsie was made — the one only you lot know.",
    "home.step.open.submit": "Open mapsie",

    "room.actions.newMap": "Create new mapsie",
    "room.actions.shareMap": "Share with friends",
    "room.actions.directions": "Directions",
    "room.view.map": "Map",
    "room.view.list": "Leaderboard",
    "room.view.latest": "Latest",
    "room.filter.allCategories": "All categories",
    "room.city.createCta": "Create",
    "room.city.addCta": "Add",
    "room.city.addBusy": "Adding…",
    "room.city.namePlaceholder": "City",
    "room.city.nameAria": "City name",
    "room.city.emojiAria": "City emoji or flag",
    "room.city.detailsNamePlaceholder": "Name of new city",
    "room.city.emptyLead": "No cities on this mapsie yet — create the first one.",
    "room.city.createError": "Could not create city",
    "room.city.missingSlug": "Missing city",
    "room.city.unknownError": "Unknown error",
    "room.city.editTitle": "Edit city",
    "room.city.editSave": "Save",
    "room.city.editSaving": "Saving…",
    "room.city.editNamePlaceholder": "City name",
    "room.city.editEmojiPlaceholder": "🌍",
    "room.city.editError": "Could not save",
    "room.city.deleteCta": "Delete city…",
    "room.city.deleteBusy": "Deleting…",
    "room.city.deleteError": "Could not delete city",
    "room.city.deleteConfirm": "Delete \"{name}\" and all tips in that city? This cannot be undone.",
    "room.city.deleteSuccessToast": "City deleted",

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
    "cat.annat": "Don't go here",

    "share.copy":
      "Let your friends add their best tips, or +1 tips they especially agree with.",
    "share.copiedToast": "Copied! Paste into iMessage/Facebook/any app.",
    "share.sheet.sms": "SMS / iMessage",
    "share.sheet.whatsapp": "WhatsApp",
    "share.sheet.facebook": "Facebook",
    "share.sheet.email": "Email",
    "share.sheet.copy": "Copy link",
    "share.sheet.close": "Close",

    "rename.title": "Rename mapsie",
    "rename.subtitle": "The link won’t change. Only the name.",
    "rename.save": "Save",
    "rename.saving": "Saving…",
    "rename.successToast": "Mapsie name updated.",
    "rename.errorDefault": "Could not save name",
    "rename.publicReadLabel": "Anyone with the link can view (read-only)",
    "rename.publicReadHint":
      "Guests see the map and lists without a PIN. Liking or adding tips still requires the PIN.",
    "rename.settingsSavedToast": "Settings saved.",

    "room.publicUnlock.lede": "Enter the PIN to like, add tips, or change this mapsie.",
    "room.publicEmptyGuest": "This mapsie has no cities yet.",
    "room.publicEmptyGuestHint": "Create the first city using the PIN form below.",
    "room.guestBanner":
      "You’re viewing as a guest — the map and lists are read-only. Enter the PIN when you want to contribute.",

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

    "unlock.lede": "Enter the PIN to open the mapsie.",
    "unlock.pinLabel": "PIN",
    "unlock.cta": "Open mapsie",
    "unlock.ctaBusy": "Opening…",
    "unlock.createLink": "Create a mapsie",
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

