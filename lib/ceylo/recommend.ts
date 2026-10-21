import type {CeyloCatalogue,CeyloExperience,CeyloPlace} from "./catalogue.ts";

export type CeyloContext={month?:number;family?:boolean;romantic?:boolean;days?:number;interests?:string[];placeId?:string};
export type CeyloLink={kind:"Destination"|"Experience";id:string;name:string;href:string};
export type CeyloReply={text:string;links:CeyloLink[];journeyHref:string;context:CeyloContext;source?:{label:string;href:string}};
const months=["january","february","march","april","may","june","july","august","september","october","november","december"];
const fold=(s:string)=>s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const categories={beach:/\bbeach|coast|surf|ocean|sea\b|lagoon/,wildlife:/wildlife|safari|elephant|leopard|bird|national park/,nature:/nature|waterfall|forest|mountain|tea|hike|walk|scenic|garden/,culture:/heritage|history|temple|fort|culture|kingdom|sacred/};
const textFor=(r:CeyloPlace|CeyloExperience)=>fold([r.name,r.summary,"category" in r?r.category:r.region].join(" "));
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const monthOf=(text:string)=>months.findIndex(m=>new RegExp(`\\b${m}(?:'s)?\\b`).test(text))+1;
const seasonMatches=(season:string,month:number)=>{
  const value=fold(season);if(/year.round|all year/.test(value))return true;
  const found=[...value.matchAll(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/g)];
  if(!found.length)return null;
  const indexes=found.map(m=>months.findIndex(name=>name.startsWith(m[1].slice(0,3)))+1);
  if(found.length===2&&/[-–—]|\bto\b/.test(value.slice((found[0].index??0)+found[0][0].length,found[1].index))){
    const [start,end]=indexes;return start<=end?month>=start&&month<=end:month>=start||month<=end;
  }
  return indexes.includes(month);
};
const placeLink=(r:CeyloPlace):CeyloLink=>({kind:"Destination",id:r.id,name:r.name,href:`/destinations/${r.slug}`});
const experienceLink=(r:CeyloExperience):CeyloLink=>({kind:"Experience",id:r.id,name:r.name,href:`/experiences/${r.slug}`});
const scoreInterest=(text:string,interests:string[])=>interests.reduce((n,key)=>n+(categories[key as keyof typeof categories]?.test(text)?3:0),0);

/** Deterministic, bounded catalogue matching — deliberately NOT a live LLM. */
export function recommendCeylo(question:string,catalogue:CeyloCatalogue,previous:CeyloContext={}):CeyloReply{
  const query=fold(question.trim().slice(0,600));
  const base={links:[] as CeyloLink[],journeyHref:"/journey-builder?step=0",context:{...previous}};
  if(!query)return {...base,text:"Tell me a little about your interests, travel month or a Sri Lankan place you would like to explore."};
  if(/supplier|allocation|margin|service.role|private|staff|password|token|customer record|traveller record|ignore.{0,25}instruction/.test(query))return {...base,text:"I only use published destination and Experience descriptions. I cannot access private traveller, staff, supplier-contact, allocation or finance information. Which part of Sri Lanka would you like to explore?"};
  if(/\b(price|prices|pricing|cost|costs|quote|availability|available|book|booking|payment|refund)\b/.test(query))return {...base,text:"I can suggest published places and Experiences, but I cannot quote prices, check inventory or availability, make bookings or take payments. Use Plan Your Journey for a human-reviewed proposal. What kind of journey appeals to you?"};
  if(!catalogue.destinations.length)return {...base,text:"The published catalogue is temporarily unavailable, so I will not invent recommendations. You can still open Plan Your Journey, or try Ceylo again later."};
  const matchedPlace=catalogue.destinations.find(p=>new RegExp(`\\b${escape(fold(p.name))}\\b`).test(query));
  const interests=Object.entries(categories).filter(([,pattern])=>pattern.test(query)).map(([key])=>key);
  const dayWords:Record<string,number>={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14};
  const dayMatch=query.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen)\s*days?\b/);
  const explicitMonth=monthOf(query),family=/family|children|kids|toddler/.test(query),romantic=/honeymoon|romantic|couple/.test(query);
  const context:CeyloContext={...previous,...(explicitMonth?{month:explicitMonth}:{}),...(dayMatch?{days:Number(dayMatch[1])||dayWords[dayMatch[1]]}:{}),...(family?{family:true}:{}),...(romantic?{romantic:true}:{}),...(interests.length?{interests}:{}),...(matchedPlace?{placeId:matchedPlace.id}:{} )};
  if(!matchedPlace&&(interests.length||romantic||dayMatch))delete context.placeId;
  const recognized=Boolean(matchedPlace||interests.length||explicitMonth||family||romantic||dayMatch||/sri lanka|recommend|journey|holiday|travel|hello|^hi\b/.test(query));
  if(!recognized)return {...base,text:"I'm a guided Sri Lanka catalogue demo, not a general-purpose AI assistant. Try a travel month, a place such as Ella, or an interest such as beaches, wildlife or heritage."};
  const chosenInterests=context.interests??(context.romantic?["beach","nature"]:context.month?["beach","culture"]:[]);
  const specific=catalogue.destinations.find(p=>p.id===context.placeId);
  const rankedPlaces=catalogue.destinations.map(place=>{
    const text=textFor(place);let score=scoreInterest(text,chosenInterests);
    if(context.family&&/quiet|lagoon|unhurried|family|sheltered/.test(text))score+=1;
    if(context.romantic&&/scenic|quiet|tea|coast|unhurried|mountain/.test(text))score+=2;
    if(context.month){const inSeason=seasonMatches(place.season,context.month);score+=inSeason===true?3:inSeason===false?-2:0;
      if([11,12,1,2,3].includes(context.month)&&categories.beach.test(text)&&/southern|western|south coast|southwest/.test(text))score+=2;
    }
    if(context.days&&context.days<=7&&!chosenInterests.length)score+=["sigiriya","kandy","colombo"].includes(place.slug)?4:0;
    return {place,score};
  }).sort((a,b)=>b.score-a.score||a.place.name.localeCompare(b.place.name));
  const places=specific?[specific]:rankedPlaces.filter(p=>p.score>0||!chosenInterests.length).slice(0,context.days&&context.days<=7?2:3).map(p=>p.place);
  const placeIds=new Set(places.map(p=>p.id));
  const experiences=catalogue.experiences.filter(e=>e.destinationIds.some(id=>placeIds.has(id))&&(!context.family||e.familyFriendly&&e.childSuitable)).map(experience=>({experience,score:scoreInterest(textFor(experience),chosenInterests)+(context.month&&seasonMatches(experience.season,context.month)===true?2:0)})).sort((a,b)=>b.score-a.score||a.experience.name.localeCompare(b.experience.name)).slice(0,3).map(e=>e.experience);
  if(!places.length&&!experiences.length)return {...base,context,text:"I couldn't find a strong published catalogue match for that combination. Would you prefer beaches, hill country, wildlife or heritage? I won't invent an Experience or promise availability."};
  const paragraphs=[specific?`For ${specific.name}, these are published ideas to explore.`:context.days?`With ${context.days} days, start with a small number of bases rather than trying to cover the whole island. These published places are ideas, not a confirmed itinerary.`:context.romantic?"For a honeymoon, I would begin with an unhurried mix of scenery and time together. These are published starting points, not confirmed arrangements.":context.family?"For a family journey, begin with the children's ages, your travel month and the pace that feels comfortable. These published places are starting points to discuss.":"Here are a few starting points from the published Sri Lanka catalogue."];
  if(places.length)paragraphs.push(places.map(p=>`${p.name}${p.summary?` — ${p.summary}`:""}`).join("\n"));
  if(experiences.length)paragraphs.push("Experiences to explore: "+experiences.map(e=>e.name).join("; ")+".");
  if(context.month)paragraphs.push(`${months[context.month-1][0].toUpperCase()+months[context.month-1].slice(1)} guidance is seasonal, not a live forecast. Regional monsoons and conditions vary; check official forecasts before deciding. Catalogue season notes do not guarantee operation or availability.`);
  if(context.family&&chosenInterests.includes("beach"))paragraphs.push("Sea conditions, supervision and age suitability need checking locally. A beach recommendation is not a swimming-safety assurance.");
  if(chosenInterests.includes("wildlife"))paragraphs.push("Wildlife sightings are never guaranteed; arrangements and park conditions need human confirmation.");
  paragraphs.push(specific?"Would you prefer a gentler day or something more active?":context.family?!context.month?"How old are the children, and which month will you travel?":!context.days?"How old are the children, and how many days do you have?":"How old are the children, and would you prefer a gentler pace?":!context.month?"Which month are you travelling, and how many days do you have?":!context.days?"Would you favour beaches, nature or cultural places, and how many days do you have?":"Would you prefer a gentler pace or a more active journey?");
  const first=places[0];
  return {text:paragraphs.join("\n\n").slice(0,2400),links:[...places.map(placeLink),...experiences.map(experienceLink)],journeyHref:first?`/journey-builder?destination=${encodeURIComponent(first.id)}&step=0`:base.journeyHref,context,...(context.month?{source:{label:"Sri Lanka Tourism seasonal guidance",href:"https://www.srilanka.travel/weather"}}:{})};
}
