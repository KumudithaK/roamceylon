"use client";
import {motion,useReducedMotion} from "motion/react";
export function FadeIn({children,delay=0,className}:{children:React.ReactNode;delay?:number;className?:string}){
  const reducedMotion=useReducedMotion();
  return <motion.div initial={reducedMotion?false:{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-40px"}} transition={{duration:reducedMotion?0:.45,delay:reducedMotion?0:Math.min(Math.max(delay,0),.3),ease:[.22,1,.36,1]}} className={className}>{children}</motion.div>;
}
