const isCentAmount=(value:number)=>Number.isFinite(value)&&value>=0&&
  Math.abs(value*100-Math.round(value*100))<1e-7;

export function proposalBalance(total:number,deposit:number|null):number|null{
  return deposit===null?null:(Math.round(total*100)-Math.round(deposit*100))/100;
}

export function validateProposalPaymentTerms(total:number,deposit:number|null|undefined,depositDueDate?:string,balanceDueDate?:string):string|null{
  if(!isCentAmount(total)||total<=0)return "A positive, cent-precise selling price is required before preparing a proposal.";
  if(deposit===null||deposit===undefined||deposit===0){
    return depositDueDate||balanceDueDate?"Set a positive deposit amount before adding payment due dates.":null;
  }
  if(!isCentAmount(deposit)||deposit>total)return "The deposit must be a cent-precise amount no greater than the proposal total.";
  if(depositDueDate&&balanceDueDate&&balanceDueDate<depositDueDate)return "The balance due date cannot precede the deposit due date.";
  return null;
}
