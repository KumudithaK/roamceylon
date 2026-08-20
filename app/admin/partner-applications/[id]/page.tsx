import {PartnerApplicationReview} from "@/features/admin/partner-application-review";
import {AdminShell} from "@/features/admin/admin-shell";
export default async function Page({params}:{params:Promise<{id:string}>}){return <AdminShell requiredPermission="suppliers.manage"><PartnerApplicationReview id={(await params).id}/></AdminShell>}
