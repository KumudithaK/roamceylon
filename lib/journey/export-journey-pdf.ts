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
  routeCoordinates?:Array<{name:string;latitude:number;longitude:number}>;
  quote:PublicPackageQuote|null;
};

const PAGE_WIDTH=595;
const PAGE_HEIGHT=842;
const MARGIN=38;
const CONTENT_WIDTH=PAGE_WIDTH-(MARGIN*2);
const ISLAND_POINTS:Array<[number,number]>=[[198.4,270.3],[190.6,314.7],[175.7,335.1],[145.2,356.3],[121.7,364.6],[103,374.8],[88.9,376.7],[73.2,371.1],[53.7,346.2],[47.4,316.5],[39.6,282.3],[36.4,262],[34.1,224],[27.8,176.9],[38,145.4],[47.4,117.7],[45.8,104.7],[55.2,90.9],[59.9,76.1],[56,61.2],[63,47.4],[73.2,38.1],[67,24.2],[63,17.8],[78.7,24.2],[94.3,42.7],[86.5,52],[106.1,61.2],[120.2,79.7],[133.5,102.9],[145.2,126],[157,149.1],[164.8,176.9],[172.6,190.7],[184.3,213.9],[190.6,237],[198.4,270.3]];

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
  const logoBytes=await fetch("/assets/logo/roam-ceylon-elephant-transparent.png").then(response=>{
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

  const drawLotusMotif=(page:PDFPage,x:number,y:number,scale=1,opacity=.18)=>{
    const petals:Array<[number,number]>=[[0,13],[12,5],[8,-9],[0,-14],[-8,-9],[-12,5]];
    petals.forEach(([dx,dy])=>page.drawCircle({x:x+(dx*scale),y:y+(dy*scale),size:5.5*scale,borderColor:goldLight,borderWidth:.8,opacity}));
    page.drawCircle({x,y,size:4*scale,color:goldLight,opacity});
  };

  const drawCoverMap=(page:PDFPage,x:number,y:number,width:number,height:number)=>{
    const mapPoint=([pointX,pointY]:[number,number])=>({x:x+(pointX/220)*width,y:y+height-(pointY/400)*height});
    for(let index=1;index<ISLAND_POINTS.length;index+=1){
      page.drawLine({start:mapPoint(ISLAND_POINTS[index-1]),end:mapPoint(ISLAND_POINTS[index]),thickness:1.15,color:white,opacity:.34});
    }
    const coordinates=(details.routeCoordinates??[]).filter(item=>Number.isFinite(item.latitude)&&Number.isFinite(item.longitude));
    const routePoint=(item:{latitude:number;longitude:number})=>mapPoint([32+((item.longitude-79.6)/2.4)*166,376-((item.latitude-5.8)/4.2)*344]);
    const actualPoints=coordinates.map(routePoint);
    actualPoints.slice(1).forEach((point,index)=>page.drawLine({start:actualPoints[index],end:point,thickness:2,color:goldLight,opacity:.9}));
    const displayedPoints:Array<{x:number;y:number}>=[];
    actualPoints.forEach((actual,index)=>{
      let marker={...actual};
      while(displayedPoints.some(point=>Math.hypot(point.x-marker.x,point.y-marker.y)<17))marker={x:marker.x+15,y:marker.y-(index%2?13:-13)};
      if(marker.x!==actual.x||marker.y!==actual.y)page.drawLine({start:actual,end:marker,thickness:.8,color:white,opacity:.65});
      displayedPoints.push(marker);
      page.drawCircle({x:marker.x,y:marker.y,size:8,color:goldLight,borderColor:white,borderWidth:1});
      const label=String(index+1);
      page.drawText(label,{x:marker.x-(bold.widthOfTextAtSize(label,7)/2),y:marker.y-2.5,size:7,font:bold,color:forest});
    });
  };

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
    page.drawText("JOURNEY SUMMARY",{x:PAGE_WIDTH/2-34,y:22,size:7,font:bold,color:gold});
    const number=String(pageNumber);
    page.drawText(number,{x:PAGE_WIDTH-MARGIN-bold.widthOfTextAtSize(number,8),y:21,size:8,font:bold,color:stone});
  };

  const createPage=()=>{
    pageNumber+=1;
    const page=pdf.addPage([PAGE_WIDTH,PAGE_HEIGHT]);
    page.drawRectangle({x:0,y:0,width:PAGE_WIDTH,height:PAGE_HEIGHT,color:ivory});
    page.drawRectangle({x:0,y:PAGE_HEIGHT-6,width:PAGE_WIDTH,height:6,color:gold});
    page.drawRectangle({x:0,y:PAGE_HEIGHT-92,width:PAGE_WIDTH,height:86,color:forest});
    const logoSize=logo.scaleToFit(70,56);
    page.drawRectangle({x:MARGIN,y:PAGE_HEIGHT-76,width:78,height:58,color:white,borderColor:goldLight,borderWidth:.6});
    page.drawImage(logo,{x:MARGIN+4+(70-logoSize.width)/2,y:PAGE_HEIGHT-74+(56-logoSize.height)/2,width:logoSize.width,height:logoSize.height});
    page.drawText("YOUR SRI LANKA STORY",{x:136,y:PAGE_HEIGHT-46,size:19,font:serif,color:white});
    page.drawText("A PERSONALISED JOURNEY SUMMARY",{x:136,y:PAGE_HEIGHT-67,size:7,font:bold,color:goldLight});
    drawLotusMotif(page,PAGE_WIDTH-55,PAGE_HEIGHT-48,.75,.28);
    drawFooter(page);
    return page;
  };

  let pageNumberedCover=pdf.addPage([PAGE_WIDTH,PAGE_HEIGHT]);
  pageNumber+=1;
  pageNumberedCover.drawRectangle({x:0,y:0,width:PAGE_WIDTH,height:PAGE_HEIGHT,color:forest});
  pageNumberedCover.drawRectangle({x:0,y:PAGE_HEIGHT-8,width:PAGE_WIDTH,height:8,color:gold});
  pageNumberedCover.drawRectangle({x:0,y:0,width:PAGE_WIDTH,height:150,color:forestSoft});
  drawLotusMotif(pageNumberedCover,42,72,1.5,.12);
  drawLotusMotif(pageNumberedCover,PAGE_WIDTH-42,PAGE_HEIGHT-52,1.15,.16);
  const coverLogo=logo.scaleToFit(110,90);
  pageNumberedCover.drawRectangle({x:MARGIN,y:PAGE_HEIGHT-142,width:120,height:104,color:white,borderColor:goldLight,borderWidth:.8});
  pageNumberedCover.drawImage(logo,{x:MARGIN+5+(110-coverLogo.width)/2,y:PAGE_HEIGHT-135+(90-coverLogo.height)/2,width:coverLogo.width,height:coverLogo.height});
  pageNumberedCover.drawText("PRIVATE, TAILOR-MADE SRI LANKA",{x:MARGIN,y:PAGE_HEIGHT-185,size:7,font:bold,color:goldLight});
  pageNumberedCover.drawText("Your Sri Lanka",{x:MARGIN,y:PAGE_HEIGHT-232,size:31,font:serif,color:white});
  pageNumberedCover.drawText("story starts here.",{x:MARGIN,y:PAGE_HEIGHT-270,size:31,font:serif,color:white});
  drawWrapped(pageNumberedCover,"A considered journey shaped around your pace, your interests and the moments that will stay with you.",MARGIN,PAGE_HEIGHT-304,{size:10,color:rgb(.82,.87,.84),maxWidth:275,lineHeight:15});
  const generated=new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date());
  pageNumberedCover.drawText(`PREPARED ${clean(generated).toUpperCase()}`,{x:MARGIN,y:PAGE_HEIGHT-366,size:7,font:bold,color:goldLight});
  drawCoverMap(pageNumberedCover,345,205,190,350);
  pageNumberedCover.drawText("YOUR ROUTE",{x:372,y:189,size:7,font:bold,color:goldLight});
  const coverRoute=clean(details.destinations.join("  -  ")||"Your route will appear here");
  drawWrapped(pageNumberedCover,coverRoute,372,171,{font:bold,size:8.5,color:white,maxWidth:170,lineHeight:12});

  const travellers=details.travellerCounts.adults+details.travellerCounts.children+details.travellerCounts.infants;
  const metricValues=[
    [`${travellers}`,"TRAVELLERS"],
    [details.travelDates.start?`${formatDate(details.travelDates.start)} - ${formatDate(details.travelDates.end)}`:"Dates to be selected","TRAVEL WINDOW"],
    [details.estimatedDistance?`${details.estimatedDistance} km  |  ${details.estimatedTravelDays} travel days`:"Route in progress","JOURNEY ROUTE"]
  ];
  metricValues.forEach(([value,label],index)=>{
    const x=MARGIN+(index*177);
    pageNumberedCover.drawRectangle({x,y:66,width:165,height:65,color:forest,borderColor:goldLight,borderWidth:.65,opacity:.96});
    pageNumberedCover.drawText(label,{x:x+13,y:108,size:6.5,font:bold,color:goldLight});
    const valueLines=wrap(value,bold,index===1?8.5:11,139);
    valueLines.slice(0,2).forEach((line,lineIndex)=>pageNumberedCover.drawText(line,{x:x+13,y:84-(lineIndex*12),size:index===1?8.5:11,font:bold,color:white}));
  });
  pageNumberedCover.drawText("JOURNEY SUMMARY  |  PLANNING DOCUMENT - NOT A BOOKING CONFIRMATION",{x:MARGIN,y:30,size:6.5,font:bold,color:rgb(.67,.75,.71)});

  let page=createPage();
  let cursorY=720;
  const nextPage=()=>{
    page=createPage();
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

  page.drawText("THE JOURNEY AT A GLANCE",{x:MARGIN,y:cursorY,size:7,font:bold,color:gold});
  page.drawText("Everything you have chosen, beautifully connected.",{x:MARGIN,y:cursorY-31,size:20,font:serif,color:forest});
  drawWrapped(page,"This summary brings together your route, experiences and travel preferences before your journey designer prepares the final proposal.",MARGIN,cursorY-54,{size:8.5,color:stone,maxWidth:CONTENT_WIDTH,lineHeight:12});
  cursorY-=88;

  const routeNames=details.destinations.length?details.destinations:["Choose destinations in the Journey Designer"];
  const routeEntries=routeNames.map((name,index)=>`${index+1}. ${name}`);
  if(details.estimatedDistance)routeEntries.push(`${details.estimatedDistance} km estimated road distance - ${details.estimatedTravelDays} travel day${details.estimatedTravelDays===1?"":"s"}`);
  drawListSection("Your route",routeEntries);
  drawListSection("Travel themes",details.themes);
  drawListSection("Experiences to look forward to",details.experiences);

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
