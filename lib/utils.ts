import {clsx,type ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs:ClassValue[]){return twMerge(clsx(inputs));}
export const titleCase=(value:string)=>value.replaceAll("-"," ").replace(/\b\w/g,letter=>letter.toUpperCase());
