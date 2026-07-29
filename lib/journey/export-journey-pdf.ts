import type {PDFFont,PDFPage,RGB} from "pdf-lib";
import type {PublicPackageQuote} from "@/lib/pricing/package-types";

export type JourneyPdfDetails={
  themes:string[];
  destinations:string[];
  experiences:string[];
  accommodations:string[];
  vehicle:string|null;
  guide:string|null;
  travelDates:{start:string;end:string};
  travellerCounts:{adults:number;children:number;infants:number};
  estimatedDistance:number;
  estimatedTravelDays:number;
  quote:PublicPackageQuote|null;
};

const PAGE_WIDTH=595;
const PAGE_HEIGHT=842;
const MARGIN=38;
const CONTENT_WIDTH=PAGE_WIDTH-(MARGIN*2);

const clean=(value:string)=>value
  .normalize("NFKD")
  .replace(/[^\x20-\x7E]/g," ")
  .replace(/\s+/g," ")
  .trim();

const formatMoney=(currency:string,value:number|null|undefined)=>
  value===null||value===undefined?"Pending":`${currency} ${value.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

const formatDate=(value:string)=>{
  if(!value)return "Not selected";
  const date=new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric"}).format(date);
};

export async function exportJourneyPdf(details:JourneyPdfDetails){
  const logoBytes=await fetch("/assets/logo/roam-ceylon-elephant.png").then(response=>{
    if(!response.ok)throw new Error("Roam Ceylon logo could not be loaded.");
    return response.arrayBuffer();
  });
  const bytes=await buildJourneyPdf(details,logoBytes);
  const blob=new Blob([new Uint8Array(bytes)],{type:"application/pdf"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download="roam-ceylon-personal-journey.pdf";
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export async function buildJourneyPdf(details:JourneyPdfDetails,logoBytes:ArrayBuffer|Uint8Array){
  const {PDFDocument,StandardFonts,rgb}=await import("pdf-lib");
  const pdf=await PDFDocument.create();
  pdf.setTitle("Roam Ceylon - Personal Journey");
  pdf.setAuthor("Roam Ceylon");
  pdf.setSubject("Personalised Sri Lanka journey summary");
  pdf.setCreator("Roam Ceylon Journey Designer");

  const regular=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif=await pdf.embedFont(StandardFonts.TimesRomanBold);
  const logo=await pdf.embedPng(logoBytes);

  const forest=rgb(18/255,61/255,51/255);
  const forestSoft=rgb(31/255,78/255,66/255);
  const gold=rgb(195/255,140/255,45/255);
  const goldLight=rgb(224/255,183/255,104/255);
  const ivory=rgb(1,253/255,248/255);
  const sand=rgb(246/255,241/255,229/255);
  const slate=rgb(36/255,43/255,41/255);
  const stone=rgb(113/255,109/255,101/255);
  const white=rgb(1,1,1);
  const border=rgb(226/255,218/255,201/255);

  const wrap=(value:string,font:PDFFont,size:number,maxWidth:number)=>{
    const words=clean(value).split(" ").filter(Boolean);
    const lines:string[]=[];
    let line="";
    for(const word of words){
      const candidate=line?`${line} ${word}`:word;
      if(line&&font.widthOfTextAtSize(candidate,size)>maxWidth){
        lines.push(line);
        line=word;
      }else line=candidate;
    }
    if(line)lines.push(line);
    return lines.length?lines:[""];
  };

  const drawWrapped=(page:PDFPage,value:string,x:number,y:number,options:{font?:PDFFont;size?:number;color?:RGB;maxWidth?:number;lineHeight?:number}={})=>{
    const font=options.font??regular;
    const size=options.size??10;
    const lineHeight=options.lineHeight??14;
    const lines=wrap(value,font,size,options.maxWidth??CONTENT_WIDTH);
    lines.forEach((line,index)=>page.drawText(line,{x,y:y-(index*lineHeight),size,font,color:options.color??slate}));
    return lines.length*lineHeight;
  };

  let pageNumber=0;
  const drawFooter=(page:PDFPage)=>{
    page.drawLine({start:{x:MARGIN,y:39},end:{x:PAGE_WIDTH-MARGIN,y:39},thickness:.7,color:border});
    page.drawText("ROAM CEYLON  |  JOURNEYS THAT CONNECT",{x:MARGIN,y:22,size:7,font:bold,color:forest});
    const number=String(pageNumber);
    page.drawText(number,{x:PAGE_WIDTH-MARGIN-bold.widthOfTextAtSize(number,8),y:21,size:8,font:bold,color:stone});
  };

  const createPage=(continuation=false)=>{
    pageNumber+=1;
    const page=pdf.addPage([PAGE_WIDTH,PAGE_HEIGHT]);
    page.drawRectangle({x:0,y:0,width:PAGE_WIDTH,height:PAGE_HEIGHT,color:ivory});
    page.drawRectangle({x:0,y:PAGE_HEIGHT-6,width:PAGE_WIDTH,height:6,color:gold});
    if(continuation){
      page.drawRectangle({x:0,y:PAGE_HEIGHT-94,width:PAGE_WIDTH,height:88,color:forest});
      const logoSize=logo.scaleToFit(64,54);
      page.drawRectangle({x:MARGIN,y:PAGE_HEIGHT-78,width:72,height:58,color:white});
      page.drawImage(logo,{x:MARGIN+4+(64-logoSize.width)/2,y:PAGE_HEIGHT-76+(54-logoSize.height)/2,width:logoSize.width,height:logoSize.height});
      page.drawText("YOUR ROAM CEYLON JOURNEY",{x:128,y:PAGE_HEIGHT-48,size:18,font:serif,color:white});
      page.drawText("PERSONALISED JOURNEY - CONTINUED",{x:128,y:PAGE_HEIGHT-68,size:7,font:bold,color:goldLight});
    }
    drawFooter(page);
    return page;
  };

  let page=createPage();
  page.drawRectangle({x:0,y:632,width:PAGE_WIDTH,height:204,color:forest});
  page.drawRectangle({x:MARGIN,y:703,width:112,height:96,color:white,borderColor:goldLight,borderWidth:.8});
  const logoSize=logo.scaleToFit(104,86);
  page.drawImage(logo,{x:MARGIN+4+(104-logoSize.width)/2,y:708+(86-logoSize.height)/2,width:logoSize.width,height:logoSize.height});
  page.drawText("PRIVATE, TAILOR-MADE SRI LANKA",{x:176,y:786,size:7,font:bold,color:goldLight});
  page.drawText("Your Roam Ceylon",{x:176,y:750,size:28,font:serif,color:white});
  page.drawText("journey",{x:176,y:716,size:28,font:serif,color:white});
  page.drawText("A considered plan, shaped around the places and moments that matter to you.",{x:176,y:687,size:9,font:regular,color:rgb(.85,.88,.85)});
  const generated=new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date());
  page.drawText(`PREPARED ${clean(generated).toUpperCase()}`,{x:176,y:660,size:7,font:bold,color:goldLight});

  const travellers=details.travellerCounts.adults+details.travellerCounts.children+details.travellerCounts.infants;
  const metricValues=[
    [`${travellers}`,"TRAVELLERS"],
    [details.estimatedDistance?`${details.estimatedDistance} km`:"Route pending","ESTIMATED ROUTE"],
    [details.quote?.status==="ready"?formatMoney(details.quote.currency,details.quote.totalPackagePrice):"Personal quote","PACKAGE ESTIMATE"]
  ];
  metricValues.forEach(([value,label],index)=>{
    const x=MARGIN+(index*177);
    page.drawRectangle({x,y:549,width:165,height:64,color:white,borderColor:border,borderWidth:.8});
    page.drawText(label,{x:x+13,y:592,size:6.5,font:bold,color:gold});
    const valueLines=wrap(value,bold,index===2?10:14,139);
    valueLines.slice(0,2).forEach((line,lineIndex)=>page.drawText(line,{x:x+13,y:569-(lineIndex*13),size:index===2?10:14,font:bold,color:forest}));
  });

  let cursorY=520;
  const nextPage=()=>{
    page=createPage(true);
    cursorY=720;
  };
  const ensureSpace=(height:number)=>{
    if(cursorY-height<58)nextPage();
  };

  const drawSectionLabel=(title:string,continued=false)=>{
    page.drawText(clean(`${title}${continued?" - continued":""}`).toUpperCase(),{x:MARGIN+18,y:cursorY-23,size:7,font:bold,color:gold});
  };

  const drawListSection=(title:string,items:string[],emptyText="Not selected")=>{
    const source=(items.length?items:[emptyText]).map(clean);
    const completeHeight=59+source.reduce((total,item)=>total+Math.max(22,(wrap(item,regular,10,CONTENT_WIDTH-58).length*14)+5),0);
    if(completeHeight<650&&cursorY-completeHeight<58)nextPage();
    let index=0;
    let continued=false;
    while(index<source.length){
      const available=Math.max(90,cursorY-70);
      const entries:Array<{lines:string[];height:number}>=[];
      let height=45;
      while(index+entries.length<source.length){
        const lines=wrap(source[index+entries.length],regular,10,CONTENT_WIDTH-58);
        const entryHeight=Math.max(22,(lines.length*14)+5);
        if(entries.length&&height+entryHeight+14>available)break;
        entries.push({lines,height:entryHeight});
        height+=entryHeight;
      }
      height+=14;
      ensureSpace(height);
      page.drawRectangle({x:MARGIN,y:cursorY-height,width:CONTENT_WIDTH,height,color:white,borderColor:border,borderWidth:.7});
      page.drawRectangle({x:MARGIN,y:cursorY-height,width:4,height,color:gold});
      drawSectionLabel(title,continued);
      let rowY=cursorY-50;
      entries.forEach(entry=>{
        page.drawCircle({x:MARGIN+21,y:rowY+3,size:3,color:entries.length===1&&source[0]===emptyText?border:gold});
        entry.lines.forEach((line,lineIndex)=>page.drawText(line,{x:MARGIN+34,y:rowY-(lineIndex*14),size:10,font:regular,color:slate}));
        rowY-=entry.height;
        index+=1;
      });
      cursorY-=height+13;
      continued=true;
      if(index<source.length)nextPage();
    }
  };

  const routeNames=details.destinations.length?details.destinations:["Choose destinations in the Journey Designer"];
  const routeText=routeNames.join("  >  ");
  const routeLines=wrap(routeText,bold,10,CONTENT_WIDTH-36);
  const routeHeight=76+(Math.max(0,routeLines.length-1)*14);
  ensureSpace(routeHeight);
  page.drawRectangle({x:MARGIN,y:cursorY-routeHeight,width:CONTENT_WIDTH,height:routeHeight,color:sand,borderColor:border,borderWidth:.7});
  page.drawText("YOUR ROUTE",{x:MARGIN+18,y:cursorY-23,size:7,font:bold,color:gold});
  routeLines.forEach((line,index)=>page.drawText(line,{x:MARGIN+18,y:cursorY-47-(index*14),size:10,font:bold,color:forest}));
  if(details.estimatedDistance){
    const routeMeta=`${details.estimatedDistance} km estimated road distance  |  ${details.estimatedTravelDays} travel day${details.estimatedTravelDays===1?"":"s"}`;
    page.drawText(clean(routeMeta),{x:MARGIN+18,y:cursorY-routeHeight+14,size:8,font:regular,color:stone});
  }
  cursorY-=routeHeight+13;

  drawListSection("Travel themes",details.themes);
  drawListSection("Destinations",details.destinations);
  drawListSection("Experiences",details.experiences);

  const planLines=[
    `Travel dates: ${formatDate(details.travelDates.start)} to ${formatDate(details.travelDates.end)}`,
    `Travellers: ${details.travellerCounts.adults} adult${details.travellerCounts.adults===1?"":"s"}, ${details.travellerCounts.children} child${details.travellerCounts.children===1?"":"ren"}, ${details.travellerCounts.infants} infant${details.travellerCounts.infants===1?"":"s"}`,
    `Accommodation: ${details.accommodations.length?details.accommodations.join(", "):"Not selected"}`,
    `Private transport: ${details.vehicle||"Not selected"}`,
    `Local guide: ${details.guide||"Optional - not selected"}`
  ];
  drawListSection("Travel plan",planLines);

  if(details.quote?.status==="ready"){
    const quote=details.quote;
    const componentHeight=(quote.components?.length??0)*20;
    const priceHeight=166+componentHeight;
    ensureSpace(priceHeight);
    page.drawRectangle({x:MARGIN,y:cursorY-priceHeight,width:CONTENT_WIDTH,height:priceHeight,color:forest});
    page.drawText("YOUR PACKAGE ESTIMATE",{x:MARGIN+20,y:cursorY-25,size:7,font:bold,color:goldLight});
    page.drawText(formatMoney(quote.currency,quote.totalPackagePrice),{x:MARGIN+20,y:cursorY-61,size:25,font:serif,color:white});
    page.drawText("Total estimated package price",{x:MARGIN+20,y:cursorY-79,size:8,font:regular,color:rgb(.74,.8,.77)});
    const priceMetrics=[
      ["PRICE PER PERSON",formatMoney(quote.currency,quote.pricePerPerson)],
      ["ESTIMATED DAILY COST",formatMoney(quote.currency,quote.estimatedDailyCost)]
    ];
    priceMetrics.forEach(([label,value],index)=>{
      const x=MARGIN+20+(index*247);
      page.drawRectangle({x,y:cursorY-130,width:235,height:38,color:forestSoft});
      page.drawText(label,{x:x+10,y:cursorY-107,size:6,font:bold,color:goldLight});
      page.drawText(value,{x:x+10,y:cursorY-123,size:10,font:bold,color:white});
    });
    let componentY=cursorY-151;
    quote.components?.forEach(component=>{
      page.drawText(clean(component.label),{x:MARGIN+20,y:componentY,size:8.5,font:regular,color:rgb(.79,.84,.81)});
      const amount=formatMoney(quote.currency,component.amount);
      page.drawText(amount,{x:PAGE_WIDTH-MARGIN-20-bold.widthOfTextAtSize(amount,8.5),y:componentY,size:8.5,font:bold,color:white});
      componentY-=20;
    });
    cursorY-=priceHeight+13;
  }else{
    const priceHeight=92;
    ensureSpace(priceHeight);
    page.drawRectangle({x:MARGIN,y:cursorY-priceHeight,width:CONTENT_WIDTH,height:priceHeight,color:sand,borderColor:gold,borderWidth:1});
    page.drawText("PERSONAL QUOTATION",{x:MARGIN+18,y:cursorY-25,size:7,font:bold,color:gold});
    page.drawText("Your journey is ready for a tailored quotation.",{x:MARGIN+18,y:cursorY-49,size:15,font:serif,color:forest});
    drawWrapped(page,"Final pricing will be confirmed against current partner availability and your preferred travel details.",MARGIN+18,cursorY-68,{size:8.5,color:stone,maxWidth:CONTENT_WIDTH-36,lineHeight:12});
    cursorY-=priceHeight+13;
  }

  const noteHeight=78;
  ensureSpace(noteHeight);
  page.drawRectangle({x:MARGIN,y:cursorY-noteHeight,width:CONTENT_WIDTH,height:noteHeight,color:white,borderColor:border,borderWidth:.7});
  page.drawText("A NOTE FROM ROAM CEYLON",{x:MARGIN+18,y:cursorY-23,size:7,font:bold,color:gold});
  drawWrapped(page,"This document is a journey summary, not a booking confirmation. Availability and final inclusions will be reviewed by a Roam Ceylon journey designer before your quotation is confirmed.",MARGIN+18,cursorY-45,{size:8.5,color:stone,maxWidth:CONTENT_WIDTH-36,lineHeight:12});

  return pdf.save();
}
