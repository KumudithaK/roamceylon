import test from "node:test";
import assert from "node:assert/strict";
import {calculateCancellationPosition} from "../lib/accounting/cancellation.ts";

test("cancellation refund deducts only verified non-recoverable supplier costs",()=>{
  const result=calculateCancellationPosition({customerPaid:1275,supplierNonRecoverable:300,cancellationFee:0,otherNonRecoverableCost:0});
  assert.equal(result.calculatedRefund,975);
  assert.equal(result.cancellationProfitLoss,0);
});

test("recoverable supplier payments do not reduce the traveller refund",()=>{
  const result=calculateCancellationPosition({customerPaid:1275,supplierNonRecoverable:0,cancellationFee:0,otherNonRecoverableCost:0});
  assert.equal(result.calculatedRefund,1275);
});

test("approved fees and partial refunds produce the remaining liability",()=>{
  const result=calculateCancellationPosition({customerPaid:1275,supplierNonRecoverable:300,cancellationFee:100,otherNonRecoverableCost:0,approvedRefund:875,amountRefunded:400});
  assert.equal(result.refundLiability,475);
  assert.equal(result.cancellationProfitLoss,100);
});
