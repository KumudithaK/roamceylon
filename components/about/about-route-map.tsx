"use client";

import {motion} from "motion/react";

const island="M198.4 270.3 190.6 314.7 175.7 335.1 145.2 356.3 121.7 364.6 103 374.8 88.9 376.7 73.2 371.1 53.7 346.2 47.4 316.5 39.6 282.3 36.4 262 34.1 224 27.8 176.9 38 145.4 47.4 117.7 45.8 104.7 55.2 90.9 59.9 76.1 56 61.2 63 47.4 73.2 38.1 67 24.2 63 17.8 78.7 24.2 94.3 42.7 86.5 52 106.1 61.2 120.2 79.7 133.5 102.9 145.2 126 157 149.1 164.8 176.9 172.6 190.7 184.3 213.9 190.6 237Z";
const destinations=[
  {name:"Jaffna",x:74,y:39},
  {name:"Anuradhapura",x:91,y:91},
  {name:"Sigiriya",x:121,y:143},
  {name:"Kandy",x:105,y:188},
  {name:"Nuwara Eliya",x:112,y:228},
  {name:"Ella",x:137,y:260},
  {name:"Arugam Bay",x:177,y:276},
  {name:"Colombo",x:48,y:249},
  {name:"Galle",x:78,y:346},
  {name:"Yala",x:153,y:326},
  {name:"Trincomalee",x:160,y:147}
] as const;
const route="48,249 78,346 153,326 177,276 137,260 112,228 105,188 121,143 160,147 91,91 74,39";

export function AboutRouteMap(){
  return <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-gold/25 bg-forest p-7 text-ivory shadow-2xl shadow-forest/15 md:min-h-[650px] md:p-10">
    <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_center,#d7ad65_1px,transparent_1px)] [background-size:24px_24px]"/>
    <div className="relative flex h-full min-h-[500px] flex-col">
      <div><p className="eyebrow text-gold-light">A journey taking shape</p><h3 className="mt-3 max-w-sm font-serif text-3xl leading-tight md:text-4xl">From scattered wishes to one beautifully considered route.</h3></div>
      <svg viewBox="0 0 220 400" className="mx-auto mt-6 h-[390px] w-full max-w-[310px] flex-1" role="img" aria-label="Animated Sri Lanka map connecting highlighted destinations">
        <path d={island} fill="rgba(255,253,248,.045)" stroke="rgba(255,253,248,.52)" strokeWidth="1.8"/>
        <motion.polyline points={route} fill="none" stroke="rgba(215,173,101,.22)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" initial={{pathLength:0,opacity:0}} animate={{pathLength:[0,1,1,0],opacity:[0,.55,.55,0]}} transition={{duration:9,times:[0,.58,.82,1],repeat:Infinity,ease:"easeInOut"}}/>
        <motion.polyline points={route} fill="none" stroke="#F2C368" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 9" initial={{pathLength:0,opacity:0}} animate={{pathLength:[0,1,1,0],opacity:[0,1,1,0],strokeDashoffset:[0,-72,-120,-144]}} transition={{duration:9,times:[0,.58,.82,1],repeat:Infinity,ease:"easeInOut"}}/>
        {destinations.map((destination,index)=><g key={destination.name}>
          <motion.circle cx={destination.x} cy={destination.y} r="10" fill="none" stroke="#F2C368" strokeWidth="1.4" initial={{opacity:0,scale:.5}} animate={{opacity:[0,0,.8,0,0],scale:[.65,.65,1.65,1.9,.65]}} transition={{duration:9,times:[0,index*.045+.08,index*.045+.18,index*.045+.28,1],repeat:Infinity}}/>
          <motion.circle cx={destination.x} cy={destination.y} r="5.5" fill="#fffdf8" stroke="#c58f2f" strokeWidth="2" initial={{scale:.8}} animate={{scale:[.8,.8,1.3,.9,.8]}} transition={{duration:9,times:[0,index*.045+.08,index*.045+.18,index*.045+.28,1],repeat:Infinity}}><title>{destination.name}</title></motion.circle>
        </g>)}
      </svg>
      <div className="flex items-center justify-between border-t border-ivory/12 pt-5 text-xs text-ivory/58"><span>Listen</span><span className="text-gold-light">•</span><span>Sketch</span><span className="text-gold-light">•</span><span>Refine</span><span className="text-gold-light">•</span><span>Journey</span></div>
    </div>
  </div>;
}
