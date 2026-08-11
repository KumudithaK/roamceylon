import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(new URL(path,import.meta.url),"utf8");

test("public proposals pass through an explicit server-side customer DTO",()=>{
  const dto=read("../lib/proposals/customer-proposal-dto.ts");
  const composer=read("../lib/proposals/customer-proposal.ts");
  const service=read("../lib/proposals/traveller-proposal-service.ts");
  assert.match(dto,/import "server-only"/);
  assert.match(dto,/customerProposalSchema=z\.object/);
  assert.match(dto,/customerProposalSchema\.safeParse/);
  assert.match(service,/customerSafeProposalDto\(data\.sent_snapshot\?\?data\.customer_snapshot\)/);
  assert.match(composer,/documentStage:snapshot\.documentStage\?\?"pre_booking_proposal"/);
  for(const privateField of ["supplier_cost","gross_profit","profit_margin","commission","supplier_contact","arrival_instructions","special_notes"]){
    assert.doesNotMatch(dto,new RegExp(privateField,"i"));
  }
});

test("secure tokens are version-specific, rotated on send, and can be revoked",()=>{
  const proposalService=read("../lib/proposals/journey-proposal-service.ts");
  const travellerService=read("../lib/proposals/traveller-proposal-service.ts");
  const migration=read("../supabase/migrations/202608110001_secure_traveller_proposal_access.sql");
  assert.match(proposalService,/public_token:randomUUID\(\)/);
  assert.match(travellerService,/\.eq\("public_token",token\)/);
  assert.match(travellerService,/data\.access_revoked_at/);
  assert.match(proposalService,/revokeJourneyProposalAccess/);
  assert.match(migration,/access_revoked_at/);
  assert.match(migration,/access_revocation_reason/);
});

test("proposal engagement is tracked without invasive personal analytics",()=>{
  const service=read("../lib/proposals/traveller-proposal-service.ts");
  const migration=read("../supabase/migrations/202608110001_secure_traveller_proposal_access.sql");
  const workspace=read("../features/admin/journey-lifecycle-workspace.tsx");
  for(const field of ["first_viewed_at","last_viewed_at","view_count"]){
    assert.match(service,new RegExp(field));
    assert.match(migration,new RegExp(field));
    assert.match(workspace,new RegExp(field));
  }
  assert.doesNotMatch(service,/ipAddress|fingerprintjs|canvas|geolocation/i);
});

test("public actions preserve exact-version acceptance and structured change requests",()=>{
  const route=read("../app/api/proposals/[token]/route.ts");
  const service=read("../lib/proposals/traveller-proposal-service.ts");
  const view=read("../features/proposals/traveller-proposal.tsx");
  assert.match(service,/proposal_version:proposal\.version/);
  assert.match(service,/accepted_total:proposal\.total_selling_price/);
  assert.match(route,/"dates"/);
  assert.match(view,/value="dates">Travel dates/);
  assert.match(view,/Accept this proposal version/);
  assert.doesNotMatch(route,/supplier_cost|profit_margin|internal_notes/i);
});

test("admin proposal controls remain permission-protected",()=>{
  const route=read("../app/api/admin/journey-proposals/route.ts");
  const workspace=read("../features/admin/journey-lifecycle-workspace.tsx");
  assert.match(route,/authenticatedStaff/);
  assert.match(route,/journey\.proposal\.create/);
  assert.match(route,/action:z\.literal\("revoke"\)/);
  for(const action of ["Copy traveller link","View as traveller","Revoke link","Download proposal PDF"]){
    assert.match(workspace,new RegExp(action));
  }
});

test("digital and PDF proposals share the same customer snapshot and value promise",()=>{
  const document=read("../components/proposal/proposal-document.tsx");
  const pdf=read("../lib/proposals/export-proposal-pdf.ts");
  for(const content of ["Your journey, taken care of","stays, transport, experiences and local arrangements"]){
    assert.match(document,new RegExp(content));
    assert.match(pdf,new RegExp(content));
  }
  assert.doesNotMatch(document,/supplier cost|gross profit|profit margin|commission|markup/i);
  assert.doesNotMatch(pdf,/supplier cost|gross profit|profit margin|commission|markup/i);
});
