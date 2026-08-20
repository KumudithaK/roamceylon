import type {EnquiryStatus} from "@/lib/database.types";

export const enquiryLifecycleActions=["start_review","prepare_proposal","request_changes","mark_proposal_sent","accept_proposal","request_deposit","record_deposit","confirm_journey","prepare_operations","start_travel","complete_journey","cancel_journey","archive_journey"] as const;
export type EnquiryLifecycleAction=(typeof enquiryLifecycleActions)[number];

export const enquiryLifecycleActionLabels:Record<EnquiryLifecycleAction,string>={
  start_review:"Start review",prepare_proposal:"Prepare proposal",request_changes:"Request changes",mark_proposal_sent:"Mark proposal sent",accept_proposal:"Accept proposal",request_deposit:"Request deposit",record_deposit:"Record deposit",confirm_journey:"Confirm journey",prepare_operations:"Ready for operations",start_travel:"Start journey",complete_journey:"Complete journey",cancel_journey:"Cancel journey",archive_journey:"Archive journey"
};

const actionsByStatus:Partial<Record<EnquiryStatus,EnquiryLifecycleAction[]>>={
  new:["start_review"],under_review:["prepare_proposal"],preparing_proposal:[],proposal_sent:[],awaiting_traveller_approval:[],proposal_accepted:["request_deposit"],deposit_requested:[],deposit_paid:["confirm_journey"],journey_confirmed:["prepare_operations"],ready_for_operations:["start_travel"],travelling:["complete_journey"],completed:["archive_journey"],cancelled:["archive_journey"]
};

export const staffEnquiryLifecycleActions=(status:EnquiryStatus)=>actionsByStatus[status]??[];
