import type {PDFFont,PDFPage,RGB} from "pdf-lib";
import {proposalLinePresentation} from "./proposal-presentation";
import type {Database,Json} from "@/lib/database.types";

type Proposal=Database["public"]["Tables"]["journey_proposals"]["Row"];
type Enquiry=Database["public"]["Tables"]["enquiries"]["Row"];
const clean=(value:string)=>value.normalize("NFKD").replace(/[^\x20-\x7E]/g," ").replace(/\s+/g," ").trim();
const lines=(value:Json)=>Array.isArray(value)?value.filter((line):line is Record<string,Json>=>Boolean(line)&&typeof line==="object"&&!Array.isArray(line)):[];

export async function exportProposalPdf(proposal:Proposal,enquiry:Enquiry){
  const [{PDFDocument,StandardFonts,rgb},logoBytes]=await Promise.all([
    import("pdf-lib"),fetch("/assets/logo/roam-ceylon-elephant-transparent.png").then(response=>{if(!response.ok)throw new Error("Roam Ceylon logo could not be loaded.");return response.arrayBuffer()})
  ]);
  const pdf=await PDFDocument.create();pdf.setTitle(`${proposal.proposal_reference} - Roam Ceylon Journey Proposal`);pdf.setAuthor("Roam Ceylon Atelier");
  const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),serif=await pdf.embedFont(StandardFonts.TimesRomanBold),logo=await pdf.embedPng(logoBytes);
  const forest=rgb(18/255,61/255,51/255),gold=rgb(195/255,140/255,45/255),ivory=rgb(1,253/255,248/255),stone=rgb(112/255,106/255,96/255),slate=rgb(35/255,43/255,40/255),white=rgb(1,1,1),lineColor=rgb(230/255,222/255,205/255);
  const width=595,height=842,margin=42,content=width-margin*2;
  const wrap=(value:string,font:PDFFont,size:number,max:number)=>{const result:string[]=[];let current="";for(const word of clean(value).split(" ").filter(Boolean)){const candidate=current?`${current} ${word}`:word;if(current&&font.widthOfTextAtSize(candidate,size)>max){result.push(current);current=word}else current=candidate}if(current)result.push(current);return result.length?result:[""]};
  let page:PDFPage=pdf.addPage([width,height]);pdf.removePage(0);let cursor=0,pageNo=0;
  const footer=()=>{page.drawLine({start:{x:margin,y:38},end:{x:width-margin,y:38},thickness:.6,color:lineColor});page.drawText("ROAM CEYLON ATELIER  |  PRIVATE JOURNEY PROPOSAL",{x:margin,y:22,size:6.5,font:bold,color:forest});page.drawText(String(pageNo),{x:width-margin-8,y:22,size:7,font:bold,color:stone})};
  const newPage=()=>{if(pageNo)footer();pageNo+=1;page=pdf.addPage([width,height]);page.drawRectangle({x:0,y:0,width,height,color:ivory});page.drawRectangle({x:0,y:height-7,width,height:7,color:gold});const scaled=logo.scaleToFit(76,62);page.drawImage(logo,{x:margin,y:height-84,width:scaled.width,height:scaled.height});page.drawText("ROAM CEYLON",{x:142,y:height-49,size:18,font:serif,color:forest});page.drawText("JOURNEYS, THOUGHTFULLY DESIGNED",{x:142,y:height-67,size:6.5,font:bold,color:gold});cursor=height-112};
  const ensure=(space:number)=>{if(cursor-space<62)newPage()};
  const paragraph=(value:string,size=9.5,color:RGB=stone,max=content)=>{const wrapped=wrap(value,regular,size,max);ensure(wrapped.length*14+8);wrapped.forEach((entry,index)=>page.drawText(entry,{x:margin,y:cursor-index*14,size,font:regular,color}));cursor-=wrapped.length*14+8};
  newPage();
  page.drawRectangle({x:margin,y:cursor-137,width:content,height:137,color:forest});page.drawText(clean(proposal.proposal_reference),{x:margin+22,y:cursor-28,size:7,font:bold,color:gold});page.drawText("Your curated Sri Lanka journey",{x:margin+22,y:cursor-62,size:25,font:serif,color:white});page.drawText(`Prepared especially for ${clean(enquiry.name)}`,{x:margin+22,y:cursor-88,size:10,font:bold,color:ivory});page.drawText(`Proposal value  ${proposal.currency} ${Number(proposal.total_selling_price).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`,{x:margin+22,y:cursor-116,size:11,font:bold,color:gold});cursor-=165;
  page.drawText("A JOURNEY SHAPED AROUND YOU",{x:margin,y:cursor,size:7,font:bold,color:gold});cursor-=22;paragraph(proposal.introduction||`A private Sri Lankan journey, thoughtfully shaped for ${enquiry.name} by Roam Ceylon Atelier.`,11,slate);cursor-=8;
  page.drawText("YOUR JOURNEY ARRANGEMENTS",{x:margin,y:cursor,size:7,font:bold,color:gold});cursor-=23;
  for(const item of lines(proposal.allocation_snapshot)){
    const display=proposalLinePresentation(item);const wrapped=wrap(display.subtitle,regular,8.5,content-22);ensure(34+wrapped.length*12);page.drawText(clean(display.title),{x:margin,y:cursor,size:11,font:bold,color:forest});wrapped.forEach((entry,index)=>page.drawText(entry,{x:margin,y:cursor-16-index*12,size:8.5,font:regular,color:stone}));cursor-=28+wrapped.length*12;page.drawLine({start:{x:margin,y:cursor+8},end:{x:width-margin,y:cursor+8},thickness:.55,color:lineColor});
  }
  ensure(72);cursor-=4;page.drawText("TOTAL PRIVATE JOURNEY",{x:margin,y:cursor,size:7,font:bold,color:stone});page.drawText(`${proposal.currency} ${Number(proposal.total_selling_price).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`,{x:width-margin-190,y:cursor-5,size:22,font:serif,color:forest});cursor-=55;
  if(proposal.terms){ensure(80);page.drawText("BOOKING NOTES",{x:margin,y:cursor,size:7,font:bold,color:gold});cursor-=20;paragraph(proposal.terms,8.5,stone)}
  if(proposal.valid_until){ensure(38);page.drawText(`This proposal is valid until ${new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"long",year:"numeric"}).format(new Date(`${proposal.valid_until}T00:00:00Z`))}.`,{x:margin,y:cursor,size:8.5,font:bold,color:forest});cursor-=24}
  paragraph("All arrangements remain subject to availability until confirmed. Your Roam Ceylon journey designer will guide you through confirmation, deposit and final travel documentation.",8,stone);
  footer();
  const bytes=await pdf.save(),blob=new Blob([new Uint8Array(bytes)],{type:"application/pdf"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`${proposal.proposal_reference.toLowerCase()}-journey-proposal.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
