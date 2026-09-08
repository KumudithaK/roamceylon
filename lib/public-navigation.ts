/** Presentation only: preserve the established routes and launch query contract. */
export const publicNavigation=[
  {label:"Editions",href:"/discover"},
  {label:"Destinations",href:"/destinations"},
  {label:"Experiences",href:"/experiences"},
  {label:"Our story",href:"/about"}
] as const;

export const journeyLaunchHref="/journey-builder?step=0";

export function isActiveNavigation(pathname:string,href:string){
  return pathname===href||pathname.startsWith(`${href}/`);
}

export function hidePublicShell(pathname:string){
  return pathname==="/admin"||pathname.startsWith("/admin/")||pathname.startsWith("/proposal/");
}

/** Human-verified Batch 1 contacts. No mailbox has been approved for publication. */
export const approvedPublicContact={
  phone:"+94 78 799 7897",
  phoneHref:"tel:+94787997897",
  whatsapp:"https://wa.me/message/G2QL7XFYJ5MAP1",
  facebook:"https://www.facebook.com/profile.php?id=61592704994306",
  address:"Mahasen Mw,\nRayfield Estate,\nPallewela,\nKuliyapitiya,\nSri Lanka"
} as const;
