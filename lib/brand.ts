export const brand={
  name:"The Ceylon Edition",
  wordmark:"THE CEYLON EDITION",
  tagline:"Bespoke journeys through Sri Lanka.",
  canonicalUrl:"https://theceylonedition.com",
  primaryCta:"Plan Your Journey",
  journalName:"The Ceylon Journal"
} as const;

export const editionDisplayNames={
  heritage:"Heritage Edition",
  wildlife:"Wild Edition",
  tropical:"Coastal Edition",
  adventure:"Adventure Edition",
  wellness:"Wellness Edition",
  nature:"Nature Edition",
  culture:"Cultural Edition",
  sporting:"Sporting Edition"
} as const;

export type EditionKey=keyof typeof editionDisplayNames;

type ThemeIdentity={id?:string|null;slug?:string|null;name:string};

export function editionDisplayName(theme:ThemeIdentity){
  const key=(theme.slug||theme.id||"") as EditionKey;
  return editionDisplayNames[key]??theme.name;
}

export const legacyBrandCompatibility={
  journeyStorageKey:"roam-ceylon-journey-v3",
  legacyJourneyStorageKey:"roam-ceylon-journey-v2",
  quotationHandoffKey:"roam-ceylon-quotation-handoff-v1",
  partnerDraftKey:"roam-ceylon-partner-draft"
} as const;
