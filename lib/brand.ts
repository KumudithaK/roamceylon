export const brand={
  name:"ELAVA8 TRAVELS",
  wordmark:"ELAVA8 TRAVELS",
  tagline:"Bespoke journeys through Sri Lanka.",
  canonicalUrl:"https://theceylonedition.com",
  primaryCta:"Plan Your Journey",
  journalName:"ELAVA8 Journal"
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

/**
 * Keeps production-managed public copy aligned with the active trading brand
 * without rewriting historical records or internal compatibility identifiers.
 */
export function publicBrandText(value:string){
  return value
    .replace(/\bThe Ceylon Journal\b/gi,brand.journalName)
    .replace(/\b(?:The )?Ceylon Edition\b/gi,brand.name)
    .replace(/\bElevate Travels\b/gi,brand.name)
    .replace(/\bRoam Ceylon Atelier\b/gi,brand.name)
    .replace(/\bRoam Ceylon\b/gi,brand.name);
}
