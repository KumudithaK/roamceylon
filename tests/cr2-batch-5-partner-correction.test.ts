import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {applicationValuesForType,districtProvince,districts,exclusiveSelection,introductionIsValid,normalizedDraftType,normalizedProvince,partnerTypeFromRoute,provinceForDistrict} from "../lib/partners/partner-application.ts";

const source=(path:string)=>readFileSync(path,"utf8");

test("partner route types are canonical and explicit route intent wins over a stale draft",()=>{
  assert.equal(partnerTypeFromRoute("accommodation"),"accommodation");
  assert.equal(partnerTypeFromRoute("vehicle"),"vehicle");
  assert.equal(partnerTypeFromRoute("guide"),"guide");
  assert.equal(partnerTypeFromRoute("transport"),undefined);
  assert.equal(normalizedDraftType("guide",true,"accommodation"),"guide");
  assert.equal(normalizedDraftType("accommodation",false,"vehicle"),"vehicle");
});

test("all 25 Sri Lankan districts map deterministically to the correct province",()=>{
  assert.equal(districts.length,25);
  assert.deepEqual(districtProvince,{
    Ampara:"Eastern",Anuradhapura:"North Central",Badulla:"Uva",Batticaloa:"Eastern",Colombo:"Western",
    Galle:"Southern",Gampaha:"Western",Hambantota:"Southern",Jaffna:"Northern",Kalutara:"Western",
    Kandy:"Central",Kegalle:"Sabaragamuwa",Kilinochchi:"Northern",Kurunegala:"North Western",Mannar:"Northern",
    Matale:"Central",Matara:"Southern",Monaragala:"Uva",Mullaitivu:"Northern","Nuwara Eliya":"Central",
    Polonnaruwa:"North Central",Puttalam:"North Western",Ratnapura:"Sabaragamuwa",Trincomalee:"Eastern",Vavuniya:"Northern"
  });
  for(const district of districts)assert.equal(provinceForDistrict(district),districtProvince[district]);
  assert.equal(normalizedProvince({district:"Anuradhapura",province:"North Western"}),"North Central");
});

test("catalogue selectors implement mutually exclusive broad choices with no count limit",()=>{
  assert.deepEqual(exclusiveSelection(["Colombo","Kandy"],"Island Wide","Island Wide"),["Island Wide"]);
  assert.deepEqual(exclusiveSelection(["Island Wide"],"Sigiriya","Island Wide"),["Sigiriya"]);
  assert.deepEqual(exclusiveSelection(["Sigiriya","Kandy"],"Kandy","Island Wide"),["Sigiriya"]);
  const many=Array.from({length:50},(_,index)=>`Destination ${index}`);
  assert.equal(exclusiveSelection(many,"Destination 50","Island Wide").length,51);
  assert.deepEqual(exclusiveSelection(["Any Experience"],"Yala Jeep Safari","Any Experience"),["Yala Jeep Safari"]);
});

test("short introduction enforces the trimmed 30-character Context boundary",()=>{
  assert.equal(introductionIsValid("a".repeat(29)),false);
  assert.equal(introductionIsValid("a".repeat(30)),true);
  assert.equal(introductionIsValid("a".repeat(31)),true);
  assert.equal(introductionIsValid(`   ${"a".repeat(29)}   `),false);
  assert.equal(introductionIsValid(" ".repeat(40)),false);
});

test("switching partner type prevents irrelevant service fields from reaching application data",()=>{
  const values={applicantName:"Test",businessName:"Test Business",district:"Colombo",province:"Western",propertyType:"Villa",operatorType:"Company",guideType:"National guide",destinationsCovered:"stale",experiencesSupported:"stale"};
  const guide=applicationValuesForType("guide",values,[{name:"stale room"}],["Island Wide"],["Any Experience"]);
  assert.equal(guide.guideType,"National guide");
  assert.equal(guide.destinationsCovered,"Island Wide");
  assert.equal(guide.experiencesSupported,"Any Experience");
  assert.equal("propertyType" in guide,false);
  assert.equal("operatorType" in guide,false);
  assert.deepEqual(guide.entries,[]);
});

test("form and API retain security controls while handling recoverable submission failures",()=>{
  const form=source("features/partners/partner-application-form.tsx");
  const api=source("app/api/partner-applications/route.ts");
  const page=source("app/partners/apply/page.tsx");
  assert.match(page,/listContent\("destinations"\)/);
  assert.match(page,/listContent\("experiences"\)/);
  assert.match(form,/finally\{\s*setSubmitting\(false\)/);
  assert.match(form,/Your draft has been preserved/);
  assert.match(form,/Island Wide/);
  assert.match(form,/Any Experience/);
  assert.match(form,/role="combobox"/);
  assert.match(form,/Remove \$\{value\}/);
  assert.match(api,/publicSubmissionDigest/);
  assert.match(api,/fileMatchesDeclaredType/);
  assert.match(api,/historyError/);
  assert.match(api,/4\*1024\*1024/);
});

test("partner-type photo and verification guidance remains optional and contextual",()=>{
  const form=source("features/partners/partner-application-form.tsx");
  for(const phrase of ["property, room, facilities or surrounding-area","vehicle or fleet","professional or profile photograph","registration, licence or other business verification","vehicle, operator, registration or licence","guide licence, accreditation, association membership"]){
    assert.match(form,new RegExp(phrase));
  }
  assert.doesNotMatch(form,/Photos[^\n]{0,120}required/i);
});
