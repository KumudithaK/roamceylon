export type CancellationPositionInput={
  customerPaid:number;
  supplierNonRecoverable:number;
  cancellationFee:number;
  otherNonRecoverableCost:number;
  approvedRefund?:number|null;
  amountRefunded?:number;
};
export type CancellationOutcome="refund"|"credit_note"|"rebook"|"no_refund";
export type CancellationAssessmentInput=CancellationPositionInput&{
  outcome:CancellationOutcome;
  supplierExposure:number;
  supplierRecoverable:number;
  adminCharge:number;
};

const currencyAmount=(value:number)=>Math.max(0,Math.round((Number(value)||0)*100)/100);

export function calculateCancellationPosition(input:CancellationPositionInput){
  const customerPaid=currencyAmount(input.customerPaid);
  const supplierNonRecoverable=currencyAmount(input.supplierNonRecoverable);
  const cancellationFee=currencyAmount(input.cancellationFee);
  const otherNonRecoverableCost=currencyAmount(input.otherNonRecoverableCost);
  const calculatedRefund=currencyAmount(customerPaid-supplierNonRecoverable-cancellationFee-otherNonRecoverableCost);
  const refundTarget=input.approvedRefund==null?calculatedRefund:Math.min(customerPaid,currencyAmount(input.approvedRefund));
  const amountRefunded=currencyAmount(input.amountRefunded??0);
  const refundLiability=currencyAmount(refundTarget-amountRefunded);
  const retainedRevenue=currencyAmount(customerPaid-refundTarget);
  const cancellationProfitLoss=Math.round((retainedRevenue-supplierNonRecoverable-otherNonRecoverableCost)*100)/100;
  return {customerPaid,supplierNonRecoverable,cancellationFee,otherNonRecoverableCost,calculatedRefund,refundTarget,amountRefunded,refundLiability,retainedRevenue,cancellationProfitLoss};
}

export function createCancellationAssessment(input:CancellationAssessmentInput){
  const position=calculateCancellationPosition({...input,otherNonRecoverableCost:input.otherNonRecoverableCost+input.adminCharge});
  return Object.freeze({
    outcome:input.outcome,
    supplierExposure:currencyAmount(input.supplierExposure),
    supplierRecoverable:currencyAmount(input.supplierRecoverable),
    supplierNonRecoverable:position.supplierNonRecoverable,
    cancellationFee:position.cancellationFee,
    adminCharge:currencyAmount(input.adminCharge),
    otherNonRecoverableCost:currencyAmount(input.otherNonRecoverableCost),
    recommendedRefund:input.outcome==="refund"?position.calculatedRefund:0
  });
}

export function canPayAssessmentRefund(outcome:CancellationOutcome|null,approvedRefund:number|null,alreadyRefunded:number,requestedAmount:number){
  if(outcome!=="refund"||approvedRefund==null)return false;
  return currencyAmount(requestedAmount)<=currencyAmount(approvedRefund-alreadyRefunded);
}

export function summarizeSupplierExposure(lines:Array<{amountDue:number;nonRecoverableAmount:number}>){
  const supplierExposure=currencyAmount(lines.reduce((total,line)=>total+line.amountDue,0));
  const supplierNonRecoverable=currencyAmount(lines.reduce((total,line)=>total+line.nonRecoverableAmount,0));
  return {supplierExposure,supplierNonRecoverable,supplierRecoverable:currencyAmount(supplierExposure-supplierNonRecoverable)};
}
