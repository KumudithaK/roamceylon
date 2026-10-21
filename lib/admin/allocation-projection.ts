import type {Database,Json} from "../database.types";
import type {StaffPermission} from "./permissions";

type Allocation=Database["public"]["Tables"]["journey_supplier_allocations"]["Row"];
const safeDetails=["customJourneyRate","rooms","nights","checkIn","checkOut","startDate","endDate","serviceDate","pickupDate","dropoffDate","participants","guideRole","guideSpeciality","preferredLanguages","fromLabel","toLabel","class"];
const financialRate=["id","name","unitPrice","price","currency","chargingMethod"];
const pickJson=(value:Json,keys:readonly string[]):Json=>{
  if(!value||typeof value!=="object"||Array.isArray(value))return {};
  return Object.fromEntries(keys.flatMap(key=>{
    const item=value[key];return item===null||typeof item==="string"||typeof item==="number"||typeof item==="boolean"?[[key,item]]:[];
  }));
};

/** Same boundary on reads AND command responses; never serialize raw DB rows. */
export function allocationForStaff(row:Allocation,permissions:readonly StaffPermission[]){
  const canAllocate=permissions.includes("suppliers.allocate");
  const canSeeCosts=permissions.includes("finance.costs.view")||canAllocate;
  const canSeeRevenue=permissions.includes("finance.revenue.view")||permissions.includes("journey.proposal.view")||canAllocate;
  const canSeePayments=permissions.includes("finance.payments.manage")||permissions.includes("operations.view");
  const canSeeContacts=canAllocate||permissions.includes("operations.view");
  return {
    id:row.id,enquiry_id:row.enquiry_id,curated_journey_id:row.curated_journey_id,allocation_type:row.allocation_type,
    destination_id:row.destination_id,from_destination_id:row.from_destination_id,to_destination_id:row.to_destination_id,
    from_location_key:row.from_location_key,to_location_key:row.to_location_key,
    accommodation_id:row.accommodation_id,guide_id:row.guide_id,vehicle_id:row.vehicle_id,experience_id:row.experience_id,
    provider_name:row.provider_name,service_name:row.service_name,quantity:row.quantity,quantity_label:row.quantity_label,
    service_details:canAllocate?row.service_details:pickJson(row.service_details,safeDetails),
    supplier_cost:canSeeCosts?row.supplier_cost:null,selling_price:canSeeRevenue?row.selling_price:null,currency:row.currency,
    pricing_plan_id:row.pricing_plan_id,
    pricing_plan_snapshot:canAllocate?row.pricing_plan_snapshot:canSeeCosts?pickJson(row.pricing_plan_snapshot,financialRate):{},
    supplier_contact:canSeeContacts?row.supplier_contact:null,
    arrival_instructions:canSeeContacts?row.arrival_instructions:null,special_notes:canSeeContacts?row.special_notes:null,
    invoice_status:canSeePayments?row.invoice_status:"not_requested",payment_status:canSeePayments?row.payment_status:"pending",
    confirmation_status:row.confirmation_status,confirmed_at:row.confirmed_at,confirmed_by:row.confirmed_by,
    cancelled_at:row.cancelled_at,cancelled_by:row.cancelled_by,cancellation_reason:canSeeContacts?row.cancellation_reason:null,
    fulfilment_status:row.fulfilment_status,fulfilled_at:row.fulfilled_at,fulfilled_by:row.fulfilled_by,
    fulfilment_notes:canSeeContacts?row.fulfilment_notes:null,
    review_required:row.review_required,review_reason:row.review_reason,reviewed_at:row.reviewed_at,reviewed_by:row.reviewed_by,
    commercial_source:row.commercial_source,lock_version:row.lock_version,
    created_at:row.created_at,updated_at:row.updated_at,created_by:row.created_by,updated_by:row.updated_by
  };
}

export type AllocationStaffDto=ReturnType<typeof allocationForStaff>;

/** Preserve the command envelope without passing through future/private result keys. */
export function fulfilmentResultForStaff(value:Json){
  return pickJson(value,["enquiryId","allocationId","status","idempotent"]);
}
