import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {resolve} from "node:path";

const root=resolve(import.meta.dirname,"..");
const source=(path:string)=>readFileSync(resolve(root,path),"utf8");

describe("Phase 15 application/backend contracts",()=>{
  it("keeps public submissions behind strict server APIs",()=>{
    const enquiries=source("app/api/enquiries/route.ts");
    const partners=source("app/api/partner-applications/route.ts");
    assert.match(enquiries,/\.strict\(\)/);
    assert.match(enquiries,/public_submission_key/);
    assert.match(enquiries,/status:"new"/);
    assert.match(partners,/\.strict\(\)/);
    assert.match(partners,/publicSubmissionDigest/);
  });

  it("keeps the isolated enquiry fixture aligned with the strict public contract",()=>{
    const matrix=source("tests/phase15-end-to-end-integrity.mjs");
    assert.match(matrix,/travelStartDate:"2027-10-01"/);
    assert.match(matrix,/travellerCounts:\{adults:2,children:0,infants:0\}/);
    assert.match(matrix,/selectedDestinationIds:\[destinationId\]/);
    assert.match(matrix,/selectedStayIds:\[\]/);
    assert.doesNotMatch(matrix,/arrivalDate:"2027-10-01"/);
  });

  it("routes staff state changes through authoritative commands",()=>{
    assert.match(source("app/api/admin/enquiry-lifecycle/route.ts"),/execute_enquiry_transition/);
    assert.match(source("app/api/admin/journey-allocations/route.ts"),/save_supplier_allocations_command/);
    assert.match(source("app/api/admin/journey-allocations/route.ts"),/fulfil_supplier_allocation_command/);
    assert.match(source("app/api/admin/partner-applications/[id]/review/route.ts"),/review_partner_application_command/);
    assert.match(source("app/api/admin/partner-applications/[id]/convert/route.ts"),/convert_partner_application_command/);
    assert.match(source("lib/accounting/post-journey-account.ts"),/initialize_journey_account_command/);
  });

  it("advances the Phase 15 Curated Journey through every legal design state",()=>{
    const matrix=source("tests/phase15-end-to-end-integrity.mjs");
    const initialise=matrix.indexOf('action:"initialise"');
    const startDesigning=matrix.indexOf('action:"save",itinerary:initBody.curated.itinerary');
    const ready=matrix.indexOf('action:"ready_for_allocation"');
    assert.ok(initialise>=0&&startDesigning>initialise&&ready>startDesigning);
    assert.match(matrix,/Journey Studio readiness failed/);
  });

  it("classifies supplier replay by persisted effects rather than HTTP 200 alone",()=>{
    const matrix=source("tests/phase15-end-to-end-integrity.mjs");
    assert.match(matrix,/savedReplay\.status===200\|\|savedReplay\.status===409/);
    assert.match(matrix,/historyAfter\.count===historyBefore\.count/);
    assert.match(matrix,/receiptBefore\.count===1,receiptAfter\.count===1/);
    assert.match(matrix,/JSON\.stringify\(afterReplay\.data\)===JSON\.stringify\(beforeReplay\.data\)/);
  });

  it("cleans Phase 15 financial and supplier fixtures in foreign-key order",()=>{
    const runner=source("scripts/run-isolated-phase15-end-to-end-integrity.sh");
    const recoverability=runner.indexOf("delete from public.supplier_recoverability_history");
    const attachments=runner.indexOf("delete from public.accounting_attachments");
    const transactions=runner.indexOf("delete from public.accounting_transactions");
    const cancellation=runner.indexOf("delete from public.journey_cancellation_cases");
    const benefits=runner.indexOf("delete from public.journey_benefits");
    const settlements=runner.indexOf("delete from public.journey_settlements");
    const allocations=runner.indexOf("delete from public.journey_supplier_allocations where");
    const accounts=runner.indexOf("delete from public.journey_accounts");
    assert.ok(recoverability>=0&&attachments>recoverability&&transactions>attachments);
    assert.ok(cancellation>transactions&&settlements>cancellation&&allocations>settlements);
    assert.ok(benefits>cancellation&&benefits<allocations&&accounts>allocations);
  });

  it("uses the established Phase 14 context for Phase 15-only audit cleanup",()=>{
    const runner=source("scripts/run-isolated-phase15-end-to-end-integrity.sh");
    const securityEvidence=runner.indexOf("delete from public.staff_security_events");
    const commandReceipts=runner.indexOf("delete from public.journey_operational_command_receipts");
    assert.match(runner,/set_config\('roam\.phase14_synthetic_cleanup','on',true\)/);
    assert.match(runner,/safe_metadata->>'path' in\(select '\/api\/admin\/partner-applications\/'\|\|id::text\|\|'\/review'/);
    assert.ok(securityEvidence>=0&&securityEvidence<commandReceipts);
  });

  it("keeps proposal acceptance on the exact public-token boundary",()=>{
    const route=source("app/api/proposals/[token]/route.ts");
    const service=source("lib/proposals/traveller-proposal-service.ts");
    assert.match(route,/acceptTravellerProposal/);
    assert.match(service,/accept_journey_proposal_command/);
    assert.match(route,/z\.uuid\(\)/);
    assert.match(route,/\.strict\(\)/);
  });

  it("uses purpose-specific admin and traveller read contracts",()=>{
    assert.match(source("features/admin/dashboard.tsx"),/read_admin_dashboard/);
    assert.match(source("app/api/admin/journey-studio/route.ts"),/traveller\.pii\.design\.view/);
    assert.match(source("app/api/admin/journey-allocations/route.ts"),/finance\.costs\.view/);
  });

  it("contains one ordered Phase 2-14 stabilization migration chain",()=>{
    const migrations=readdirSync(resolve(root,"supabase/migrations"))
      .filter(name=>/^2026081200(0[1-9]|1[0-4])_/.test(name)).sort();
    assert.equal(migrations.length,14);
    assert.equal(migrations[0],"202608120001_public_data_boundaries.sql");
    assert.equal(migrations.at(-1),"202608120014_audit_observability_integrity.sql");
    assert.equal(new Set(migrations.map(name=>name.slice(0,12))).size,14);
    const runner=source("scripts/run-isolated-phase15-end-to-end-integrity.sh");
    for(const migration of migrations)assert.match(runner,new RegExp(migration.replaceAll(".","\\.")));
    assert.match(runner,/supplier_allocation_pricing_enum_compatibility/);
    assert.doesNotMatch(runner,/awk '\$0 >= "202608120001" && \$0 <= "202608120014"'/);
  });
});
