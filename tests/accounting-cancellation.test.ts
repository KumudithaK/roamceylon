import test from "node:test";
import assert from "node:assert/strict";
import {calculateCancellationPosition,canPayAssessmentRefund,createCancellationAssessment,summarizeSupplierExposure} from "../lib/accounting/cancellation.ts";

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

const assessment=(outcome:"refund"|"credit_note"|"rebook"|"no_refund")=>createCancellationAssessment({outcome,customerPaid:1275,supplierExposure:650,supplierRecoverable:350,supplierNonRecoverable:300,cancellationFee:0,adminCharge:0,otherNonRecoverableCost:0});

test("cancellation with refund produces a recommended refund",()=>{
  assert.equal(assessment("refund").recommendedRefund,975);
});

test("cancellation with a credit note does not open a cash refund",()=>{
  assert.equal(assessment("credit_note").recommendedRefund,0);
  assert.equal(canPayAssessmentRefund("credit_note",975,0,100),false);
});

test("cancellation with no refund records a zero recommendation",()=>{
  assert.equal(assessment("no_refund").recommendedRefund,0);
});

test("rebook is a cancellation outcome without a refund",()=>{
  assert.equal(assessment("rebook").recommendedRefund,0);
});

test("supplier recoverability changes update exposure without duplicating commitments",()=>{
  assert.deepEqual(summarizeSupplierExposure([{amountDue:650,nonRecoverableAmount:0}]),{supplierExposure:650,supplierNonRecoverable:0,supplierRecoverable:650});
  assert.deepEqual(summarizeSupplierExposure([{amountDue:650,nonRecoverableAmount:300}]),{supplierExposure:650,supplierNonRecoverable:300,supplierRecoverable:350});
});

test("completed assessment snapshots are immutable",()=>{
  const snapshot=assessment("refund");
  assert.equal(Object.isFrozen(snapshot),true);
  assert.throws(()=>Object.assign(snapshot,{recommendedRefund:1}),TypeError);
});

test("refund payments use the approved assessment value",()=>{
  assert.equal(canPayAssessmentRefund("refund",975,400,575),true);
  assert.equal(canPayAssessmentRefund("refund",975,400,575.01),false);
  assert.equal(canPayAssessmentRefund("refund",null,0,1),false);
});
