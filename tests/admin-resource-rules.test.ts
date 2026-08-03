import test from "node:test";
import assert from "node:assert/strict";
import {newDraft,relationshipPublishIssues} from "../lib/admin/resource-rules.ts";

const empty={themeIds:[],destinationIds:[],experienceIds:[]};

test("new resources start as inactive drafts with unique-safe slugs",()=>{
  assert.deepEqual(newDraft("vehicles","abc123"),{slug:"draft-vehicles-abc123",status:"draft",active:false,listing_title:"Untitled vehicle"});
  assert.deepEqual(newDraft("themes","abc123"),{slug:"draft-themes-abc123",status:"draft",active:false,name:"Untitled theme"});
});

test("destination and experience publishing requires explicit mappings",()=>{
  assert.deepEqual(relationshipPublishIssues("destinations",{},empty),["select at least one travel theme"]);
  assert.deepEqual(relationshipPublishIssues("experiences",{},empty),["select at least one destination","select at least one travel theme"]);
  assert.deepEqual(relationshipPublishIssues("experiences",{},{themeIds:["theme"],destinationIds:["destination"],experienceIds:[]}),[]);
});

test("marketplace coverage accepts nationwide or explicit relationships",()=>{
  assert.equal(relationshipPublishIssues("stays",{destination_id:null},empty).length,1);
  assert.equal(relationshipPublishIssues("vehicles",{nationwide:false},empty).length,1);
  assert.deepEqual(relationshipPublishIssues("vehicles",{nationwide:true},empty),[]);
  assert.deepEqual(relationshipPublishIssues("guides",{nationwide:false},{...empty,themeIds:["culture"]}),[]);
});
