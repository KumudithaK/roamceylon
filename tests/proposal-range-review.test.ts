import assert from "node:assert/strict";
import test from "node:test";
import {reviewProposalAgainstEstimate} from "../lib/proposals/proposal-range-review.ts";

const estimate={status:"estimated_range" as const,currency:"USD",basis:"per_person" as const,perPersonMin:900,perPersonMax:1100,totalMin:1800,totalMax:2200,durationDays:7,estimatedAt:"2026-08-10T00:00:00.000Z",factors:[],message:"Planning range",context:{version:1 as const,pricedComponents:[],unavailableInputs:[]}};

test("proposal inside the submitted estimate is recorded as within range",()=>{const result=reviewProposalAgainstEstimate(estimate,2100);assert.equal(result.status,"within_range");assert.equal(result.reason,null);});
test("proposal outside the submitted estimate retains the internal explanation",()=>{const result=reviewProposalAgainstEstimate(estimate,2400,"Only higher room category remained available.");assert.equal(result.status,"outside_range");assert.match(result.reason??"",/room category/);});
test("tailored or missing estimates do not block proposal generation",()=>{const result=reviewProposalAgainstEstimate(null,2400);assert.equal(result.status,"not_available");});
