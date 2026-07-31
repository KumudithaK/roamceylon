export type CancellationPositionInput={
  customerPaid:number;
  supplierNonRecoverable:number;
  cancellationFee:number;
  otherNonRecoverableCost:number;
  approvedRefund?:number|null;
  amountRefunded?:number;
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
