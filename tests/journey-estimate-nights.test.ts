import assert from "node:assert/strict";
import test from "node:test";
import {allocatePlanningNights} from "../lib/pricing/journey-estimate-nights.ts";

test("open nights are distributed for estimation without changing traveller preferences",()=>{
  const preferences={sigiriya:{nights:null},galle:{nights:null}};
  const result=allocatePlanningNights(["sigiriya","galle"],preferences,5);
  assert.deepEqual(result.nightsByDestination,{sigiriya:3,galle:2});
  assert.equal(preferences.sigiriya.nights,null);
});

test("explicit nights are respected and remaining open nights are recommended",()=>{
  const result=allocatePlanningNights(["sigiriya","kandy","galle"],{sigiriya:{nights:2},kandy:{nights:null},galle:{nights:null}},7);
  assert.deepEqual(result.nightsByDestination,{sigiriya:2,kandy:3,galle:2});
});

test("a shorter explicit stay plan leaves an honest unallocated accommodation allowance",()=>{
  const result=allocatePlanningNights(["sigiriya","galle"],{sigiriya:{nights:1},galle:{nights:1}},5);
  assert.equal(result.unallocatedNights,3);
});

test("planned nights beyond the journey duration remain invalid",()=>{
  const result=allocatePlanningNights(["sigiriya","galle"],{sigiriya:{nights:4},galle:{nights:3}},5);
  assert.equal(result.exceedsJourney,true);
});
