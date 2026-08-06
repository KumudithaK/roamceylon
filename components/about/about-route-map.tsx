"use client";

import {motion} from "motion/react";

const island="M198.4 270.3 190.6 314.7 175.7 335.1 145.2 356.3 121.7 364.6 103 374.8 88.9 376.7 73.2 371.1 53.7 346.2 47.4 316.5 39.6 282.3 36.4 262 34.1 224 27.8 176.9 38 145.4 47.4 117.7 45.8 104.7 55.2 90.9 59.9 76.1 56 61.2 63 47.4 73.2 38.1 67 24.2 63 17.8 78.7 24.2 94.3 42.7 86.5 52 106.1 61.2 120.2 79.7 133.5 102.9 145.2 126 157 149.1 164.8 176.9 172.6 190.7 184.3 213.9 190.6 237Z";
const destinations=[
  {name:"Anuradhapura",x:91,y:91},
  {name:"Sigiriya",x:121,y:143},
  {name:"Kandy",x:105,y:188},
  {name:"Colombo",x:48,y:249},
  {name:"Galle",x:78,y:346},
  {name:"Yala",x:153,y:326},
  {name:"Trincomalee",x:160,y:147}
] as const;
const route="48,249 78,346 153,326 105,188 121,143 91,91 160,147";

export function AboutRouteMap(){
  return <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-gold/25 bg-forest p-7 text-ivory shadow-2xl shadow-forest/15 md:min-h-[650px] md:p-10">
    <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_center,#d7ad65_1px,transparent_1px)] [background-size:24px_24px]"/>
    <div className="relative flex h-full min-h-[500px] flex-col">
      <div><p className="eyebrow text-gold-light">A journey taking shape</p><h3 className="mt-3 max-w-sm font-serif text-3xl leading-tight md:text-4xl">From scattered wishes to one beautifully considered route.</h3></div>
      <svg viewBox="0 0 220 400" className="mx-auto mt-6 h-[390px] w-full max-w-[310px] flex-1" role="img" aria-label="Animated Sri Lanka map connecting highlighted destinations">
        <path d={island} fill="rgba(255,253,248,.045)" stroke="rgba(255,253,248,.52)" strokeWidth="1.8"/>
        <motion.polyline points={route} fill="none" stroke="rgba(215,173,101,.25)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" initial={{pathLength:0,opacity:0}} animate={{pathLength:1,opacity:[0,.5,0]}} transition={{pathLength:{duration:3,ease:"easeInOut"},opacity:{duration:3,repeat:Infinity,repeatDelay:1.5}}}/>
        <motion.polyline points={route} fill="none" stroke="#F2C368" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 8" initial={{pathLength:0}} animate={{pathLength:1,strokeDashoffset:[0,-64]}} transition={{pathLength:{duration:2.6,ease:"easeInOut"},strokeDashoffset:{duration:5,repeat:Infinity,ease:"linear"}}}/>
        {destinations.map((destination,index)=><g key={destination.name}>
          <motion.circle cx={destination.x} cy={destination.y} r="10" fill="none" stroke="#F2C368" strokeWidth="1.4" initial={{opacity:0,scale:.5}} animate={{opacity:[0,.75,0],scale:[.65,1.6,1.9]}} transition={{duration:2.4,repeat:Infinity,delay:index*.42,repeatDelay:1.2}}/>
          <motion.circle cx={destination.x} cy={destination.y} r="5.5" fill="#fffdf8" stroke="#c58f2f" strokeWidth="2" initial={{scale:.7}} animate={{scale:[.85,1.25,.85]}} transition={{duration:2.4,repeat:Infinity,delay:index*.42,repeatDelay:1.2}}><title>{destination.name}</title></motion.circle>
        </g>)}
      </svg>
      <div className="flex items-center justify-between border-t border-ivory/12 pt-5 text-xs text-ivory/58"><span>Listen</span><span className="text-gold-light">•</span><span>Sketch</span><span className="text-gold-light">•</span><span>Refine</span><span className="text-gold-light">•</span><span>Journey</span></div>
    </div>
  </div>;
}
