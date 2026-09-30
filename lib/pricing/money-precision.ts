/** Two-decimal commercial precision for the supported launch currencies. */
export function isCentPrecise(value:number):boolean{
  return Number.isFinite(value)&&Number(value.toFixed(2))===value;
}
