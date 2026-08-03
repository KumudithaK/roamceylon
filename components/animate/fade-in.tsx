"use client";
import {motion} from "motion/react";
export function FadeIn({children,delay=0,className}:{children:React.ReactNode;delay?:number;className?:string}){return <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-80px"}} transition={{duration:.65,delay,ease:[.22,1,.36,1]}} className={className}>{children}</motion.div>;}
