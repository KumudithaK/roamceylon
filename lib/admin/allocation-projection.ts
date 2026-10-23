import type {Database,Json} from "../database.types";
import type {StaffPermission} from "./permissions";

type Allocation=Database["public"]["Tables"]["journey_supplier_allocations"]["Row"];
const safeDetails=["customJourneyRate","rooms","nights","guests","checkIn","checkOut","startDate","endDate","serviceDate","pickupDate","dropoffDate","participants","guideRole","guideSpeciality","preferredLanguages","fromLabel","toLabel","class"];
const financialRate=["id","name","unitPrice","price","currency","chargingMethod"];
export const pickStaffJson=(value:Json|undefined,keys:readonly string[]):Record<string,Json>=>{
  if(!value||typeof value!=="object"||Array.isArray(value))return {};
  return Object.fromEntries(keys.flatMap(key=>{
    if(!Object.hasOwn(value,key))return [];
    const item=value[key];return item===null||typeof item==="string"||typeof item==="number"||typeof item==="boolean"?[[key,item]]:[];
  }));
};

export function allocationAccessForStaff(permissions:readonly StaffPermission[]){
  const canAllocate=permissions.includes("suppliers.allocate");
  return {
    canAllocate,
    canSeeCosts:permissions.includes("finance.costs.view")||canAllocate,
    canSeeRevenue:permissions.includes("finance.revenue.view")||permissions.includes("journey.proposal.view")||canAllocate,
    canSeeMargins:permissions.includes("finance.margin.view"),
    canSeePayments:permissions.includes("finance.payments.manage")||permissions.includes("operations.view"),
    canSeeContacts:canAllocate||permissions.includes("operations.view")
  };
}

/** Same boundary on reads AND command responses; unauthorized keys do not exist. */
export function allocationForStaff(row:Allocation,permissions:readonly StaffPermission[]){
  const {canAllocate,canSeeCosts,canSeeRevenue,canSeePayments,canSeeContacts}=allocationAccessForStaff(permissions);
  return {
    id:row.id,enquiry_id:row.enquiry_id,curated_journey_id:row.curated_journey_id,allocation_type:row.allocation_type,
    destination_id:row.destination_id,from_destination_id:row.from_destination_id,to_destination_id:row.to_destination_id,
    from_location_key:row.from_location_key,to_location_key:row.to_location_key,
    accommodation_id:row.accommodation_id,guide_id:row.guide_id,vehicle_id:row.vehicle_id,experience_id:row.experience_id,
    provider_name:row.provider_name,service_name:row.service_name,quantity:row.quantity,quantity_label:row.quantity_label,
    service_details:canAllocate?row.service_details:pickStaffJson(row.service_details,safeDetails),
    ...(canSeeCosts?{supplier_cost:row.supplier_cost,pricing_plan_snapshot:canAllocate?row.pricing_plan_snapshot:pickStaffJson(row.pricing_plan_snapshot,financialRate)}:{}),
    ...(canSeeRevenue?{selling_price:row.selling_price}:{}),currency:row.currency,
    pricing_plan_id:row.pricing_plan_id,
    ...(canSeeContacts?{supplier_contact:row.supplier_contact,arrival_instructions:row.arrival_instructions,special_notes:row.special_notes,cancellation_reason:row.cancellation_reason,fulfilment_notes:row.fulfilment_notes}:{}),
    ...(canSeePayments?{invoice_status:row.invoice_status,payment_status:row.payment_status}:{}),
    confirmation_status:row.confirmation_status,confirmed_at:row.confirmed_at,confirmed_by:row.confirmed_by,
    cancelled_at:row.cancelled_at,cancelled_by:row.cancelled_by,
    fulfilment_status:row.fulfilment_status,fulfilled_at:row.fulfilled_at,fulfilled_by:row.fulfilled_by,
    review_required:row.review_required,review_reason:row.review_reason,reviewed_at:row.reviewed_at,reviewed_by:row.reviewed_by,
    commercial_source:row.commercial_source,lock_version:row.lock_version,
    created_at:row.created_at,updated_at:row.updated_at,created_by:row.created_by,updated_by:row.updated_by
  };
}

export type AllocationStaffDto=ReturnType<typeof allocationForStaff>;

const snapshotFields=["allocationId","type","destinationId","destinationName","fromDestinationId","fromDestinationName","toDestinationId","toDestinationName","fromLocationKey","fromLocationName","toLocationKey","toLocationName","resourceId","resourceName","pricingPlanId","serviceName","quantity","quantityLabel","providerName","currency","confirmationStatus"];

/** Camel-case frozen proposal lines follow the same policy as live allocations. */
export function allocationSnapshotForStaff(value:Json,permissions:readonly StaffPermission[]):Json|null{
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  const {canAllocate,canSeeCosts,canSeeRevenue,canSeePayments,canSeeContacts}=allocationAccessForStaff(permissions);
  return {
    ...pickStaffJson(value,snapshotFields),
    serviceDetails:canAllocate?value.serviceDetails??{}:pickStaffJson(value.serviceDetails,safeDetails),
    ...(canSeeCosts?{...pickStaffJson(value,["supplierCost"]),pricingPlanSnapshot:canAllocate?value.pricingPlanSnapshot??{}:pickStaffJson(value.pricingPlanSnapshot,financialRate)}:{}),
    ...(canSeeRevenue?pickStaffJson(value,["sellingPrice"]):{}),
    ...(canSeeContacts?pickStaffJson(value,["supplierContact","arrivalInstructions","specialNotes","fulfilmentNotes","cancellationReason"]):{}),
    ...(canSeePayments?pickStaffJson(value,["invoiceStatus","paymentStatus"]):{})
  };
}

/** Preserve the command envelope without passing through future/private result keys. */
export function fulfilmentResultForStaff(value:Json){
  return pickStaffJson(value,["enquiryId","allocationId","status","idempotent"]);
}
