import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {staffEnquiryLifecycleActions,enquiryLifecycleActions} from "../lib/enquiries/enquiry-lifecycle.ts";

describe("enquiry lifecycle commands",()=>{
  it("exposes business actions rather than arbitrary target statuses",()=>{
    assert(enquiryLifecycleActions.includes("start_review"));
    assert(!enquiryLifecycleActions.includes("completed" as never));
    assert(!enquiryLifecycleActions.includes("status" as never));
  });
  it("does not let a new enquiry skip to completion",()=>assert.deepEqual(staffEnquiryLifecycleActions("new"),["start_review"]));
  it("hands operational states to explicit next actions",()=>{
    assert.deepEqual(staffEnquiryLifecycleActions("journey_confirmed"),["prepare_operations"]);
    assert.deepEqual(staffEnquiryLifecycleActions("ready_for_operations"),["start_travel"]);
    assert.deepEqual(staffEnquiryLifecycleActions("travelling"),["complete_journey"]);
  });
  it("does not offer traveller-owned proposal transitions in the admin status control",()=>{
    assert.deepEqual(staffEnquiryLifecycleActions("proposal_sent"),[]);
    assert.deepEqual(staffEnquiryLifecycleActions("deposit_requested"),[]);
  });
});
