import {PartnerApplicationInbox} from "@/features/admin/partner-application-inbox";
import {AdminShell} from "@/features/admin/admin-shell";
export default function Page(){return <AdminShell requiredPermission="suppliers.manage"><PartnerApplicationInbox/></AdminShell>}
