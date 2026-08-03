"use client";

import {useState} from "react";
import {Copy,GripVertical,Plus,Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";
import type {Database} from "@/lib/database.types";
import type {PricingEntityType} from "@/lib/admin/resources";

type Plan=Database["public"]["Tables"]["pricing_plans"]["Row"];
type DetailValue=string|number|boolean;
type Draft=Pick<Plan,"name"|"description"|"price"|"currency"|"charging_method"|"minimum_quantity"|"maximum_quantity"|"image_url"|"notes"|"active">&{details:Record<string,DetailValue>};
const empty:Draft={name:"",description:"",price:0,currency:"USD",charging_method:"per_person",minimum_quantity:null,maximum_quantity:null,image_url:null,notes:null,active:true,details:{}};
const methods:Record<PricingEntityType,Array<[string,string]>>={
  accommodation:[["per_night","Per night"],["per_room_night","Per room / night"],["per_person","Per person"],["per_villa","Per villa"]],
  vehicle:[["per_day","Per day"],["per_trip","Per trip"],["per_airport_transfer","Per airport transfer"],["per_km","Per kilometre"]],
  guide:[["half_day","Half day"],["full_day","Full day"],["multi_day","Multi day"],["private_tour","Private tour"],["custom_rate","Custom rate"]],
  experience:[["per_person","Per person"],["private_tour","Private"],["per_trip","Per group"],["custom_rate","Custom rate"]],
  destination:[["per_entry","Per entry"],["per_person","Per person"],["per_vehicle","Per vehicle"],["fixed","Fixed fee"]]
};

type ManagerProps={entityType:PricingEntityType;entityId:string;initialPlans:Plan[];title:string;intro:string;hideMethod?:boolean;hideQuantities?:boolean};

export function RoomRates(props:{entityId:string;initialPlans:Plan[]}){return <PricingPlanManager {...props} entityType="accommodation" title="Room rates" intro="Add room, villa and occupancy rates. Put the primary rate first."/>}
export function RentalPlans(props:{entityId:string;initialPlans:Plan[]}){return <PricingPlanManager {...props} entityType="vehicle" title="Rental plans" intro="Add daily, trip, transfer and distance-based rental options."/>}
export function GuideServiceRates(props:{entityId:string;initialPlans:Plan[]}){return <PricingPlanManager {...props} entityType="guide" title="Service rates" intro="Add half-day, full-day, multi-day and private guiding rates."/>}
export function TicketTypes(props:{entityId:string;initialPlans:Plan[]}){return <PricingPlanManager {...props} entityType="experience" title="Ticket types" intro="Add adult, child, resident, visitor, private or group tickets."/>}
export function DestinationFees(props:{entityId:string;initialPlans:Plan[]}){return <PricingPlanManager {...props} entityType="destination" title="Destination fees" intro="Add entry tickets, parking fees and local levies. All active fees are included." hideMethod hideQuantities/>}

function PricingPlanManager({entityType,entityId,initialPlans,title,intro,hideMethod=false,hideQuantities=false}:ManagerProps){
  const [plans,setPlans]=useState(initialPlans.sort((a,b)=>a.sort_order-b.sort_order));
  const [editing,setEditing]=useState<Plan|null>(null);
  const [formOpen,setFormOpen]=useState(false);
  const [draft,setDraft]=useState<Draft>(empty);
  const [message,setMessage]=useState("");
  const [dragged,setDragged]=useState<string|null>(null);
  const open=(plan?:Plan)=>{setEditing(plan??null);setFormOpen(true);setDraft(plan?{name:plan.name,description:plan.description,price:plan.price,currency:plan.currency,charging_method:plan.charging_method,minimum_quantity:plan.minimum_quantity,maximum_quantity:plan.maximum_quantity,image_url:plan.image_url,notes:plan.notes,active:plan.active,details:typeof plan.details==="object"&&plan.details&&!Array.isArray(plan.details)?plan.details as Record<string,DetailValue>:{}}:{...empty,details:{},charging_method:methods[entityType][0][0]});setMessage("")};
  const save=async()=>{
    if(!draft.name.trim()){setMessage("Add a plan name.");return}
    const database=createClient();
    if(editing){
      const {data,error}=await database.from("pricing_plans").update(draft).eq("id",editing.id).select("*").single();
      if(error){setMessage(error.message);return}
      setPlans(items=>items.map(item=>item.id===editing.id?data:item));
    }else{
      const {data,error}=await database.from("pricing_plans").insert({...draft,entity_type:entityType,entity_id:entityId,sort_order:plans.length}).select("*").single();
      if(error){setMessage(error.message);return}
      setPlans(items=>[...items,data]);
    }
    setEditing(null);setFormOpen(false);setDraft(empty);setMessage("Pricing plan saved.");
  };
  const duplicate=async(plan:Plan)=>{
    const {id,created_at,updated_at,created_by,updated_by,...copy}=plan;void id;void created_at;void updated_at;void created_by;void updated_by;
    const {data,error}=await createClient().from("pricing_plans").insert({...copy,name:`${plan.name} copy`,sort_order:plans.length}).select("*").single();
    if(error){setMessage(error.message);return}setPlans(items=>[...items,data]);setMessage("Pricing plan duplicated.");
  };
  const remove=async(plan:Plan)=>{if(!window.confirm(`Remove “${plan.name}”?`))return;const {error}=await createClient().from("pricing_plans").delete().eq("id",plan.id);if(error){setMessage(error.message);return}setPlans(items=>items.filter(item=>item.id!==plan.id))};
  const reorder=async(targetId:string)=>{
    if(!dragged||dragged===targetId)return;
    const from=plans.findIndex(item=>item.id===dragged),to=plans.findIndex(item=>item.id===targetId);
    const reordered=[...plans];const [moved]=reordered.splice(from,1);reordered.splice(to,0,moved);
    const next=reordered.map((item,index)=>({...item,sort_order:index}));setPlans(next);setDragged(null);
    await Promise.all(next.map(item=>createClient().from("pricing_plans").update({sort_order:item.sort_order}).eq("id",item.id)));
  };
  const detail=(key:string)=>draft.details[key];
  const setDetail=(key:string,value:DetailValue)=>setDraft({...draft,details:{...draft.details,[key]:value}});
  return <section><div className="flex items-center justify-between"><div><h2 className="font-serif text-2xl">{title}</h2><p className="mt-1 text-sm text-stone">{intro}</p></div><Button onClick={()=>open()}><Plus/>Add {entityType==="destination"?"fee":"rate"}</Button></div>{message&&<p className="mt-4 rounded-xl bg-sand-light p-3 text-sm">{message}</p>}<div className="mt-6 grid gap-3">{plans.length?plans.map((plan,index)=><article key={plan.id} draggable onDragStart={()=>setDragged(plan.id)} onDragOver={event=>event.preventDefault()} onDrop={()=>void reorder(plan.id)} className="flex items-center gap-3 rounded-2xl border border-stone/15 bg-white p-4"><GripVertical className="cursor-grab text-stone"/><button onClick={()=>open(plan)} className="min-w-0 flex-1 text-left"><strong className="block truncate">{plan.name}</strong><span className="text-sm text-stone">{plan.currency} {Number(plan.price).toFixed(2)}{hideMethod?"":` · ${methods[entityType].find(item=>item[0]===plan.charging_method)?.[1]||plan.charging_method}`}</span></button>{index===0&&entityType!=="destination"&&<span className="rounded-full bg-gold/10 px-2 py-1 text-xs text-gold">Primary</span>}<span className={`rounded-full px-2 py-1 text-xs ${plan.active?"bg-forest/10 text-forest":"bg-stone/10 text-stone"}`}>{plan.active?"Active":"Inactive"}</span><button title="Duplicate" onClick={()=>void duplicate(plan)} className="rounded-lg p-2 hover:bg-sand"><Copy className="size-4"/></button><button title="Delete" onClick={()=>void remove(plan)} className="rounded-lg p-2 text-red-700 hover:bg-red-50"><Trash2 className="size-4"/></button></article>):<div className="rounded-2xl border border-dashed border-stone/30 p-8 text-center text-sm text-stone">No {entityType==="destination"?"fees":"rates"} yet.</div>}</div>{formOpen&&<div className="mt-8 rounded-2xl border border-gold/25 bg-sand-light p-6"><h3 className="font-serif text-xl">{editing?`Edit ${entityType==="destination"?"fee":"rate"}`:`New ${entityType==="destination"?"fee":"rate"}`}</h3><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Name"><input value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})}/></Field>{!hideMethod&&<Field label="Charging method"><select value={draft.charging_method} onChange={event=>setDraft({...draft,charging_method:event.target.value})}>{methods[entityType].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field>}<Field label="Price"><input type="number" min="0" step=".01" value={draft.price} onChange={event=>setDraft({...draft,price:Number(event.target.value)})}/></Field><Field label="Currency"><input maxLength={3} value={draft.currency} onChange={event=>setDraft({...draft,currency:event.target.value.toUpperCase()})}/></Field>{!hideQuantities&&<><Field label={entityType==="accommodation"?"Minimum nights":"Minimum quantity"}><input type="number" min="0" value={draft.minimum_quantity??""} onChange={event=>setDraft({...draft,minimum_quantity:event.target.value?Number(event.target.value):null})}/></Field><Field label={entityType==="accommodation"?"Maximum guests":"Maximum quantity"}><input type="number" min="0" value={draft.maximum_quantity??""} onChange={event=>setDraft({...draft,maximum_quantity:event.target.value?Number(event.target.value):null})}/></Field></>}{entityType==="vehicle"&&<><label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={Boolean(detail("driverIncluded"))} onChange={event=>setDetail("driverIncluded",event.target.checked)}/>Driver included</label><label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={Boolean(detail("fuelIncluded"))} onChange={event=>setDetail("fuelIncluded",event.target.checked)}/>Fuel included</label><Field label="Airport pickup fee"><input type="number" min="0" value={String(detail("airportPickupFee")??"")} onChange={event=>setDetail("airportPickupFee",Number(event.target.value))}/></Field><Field label="Extra kilometre charge"><input type="number" min="0" value={String(detail("extraKmCharge")??"")} onChange={event=>setDetail("extraKmCharge",Number(event.target.value))}/></Field><Field label="Overtime charge"><input type="number" min="0" value={String(detail("overtimeCharge")??"")} onChange={event=>setDetail("overtimeCharge",Number(event.target.value))}/></Field></>}{entityType==="guide"&&<Field label="Languages included" wide><input value={String(detail("languagesIncluded")??"")} onChange={event=>setDetail("languagesIncluded",event.target.value)}/></Field>}<Field label="Description" wide><textarea rows={3} value={draft.description??""} onChange={event=>setDraft({...draft,description:event.target.value})}/></Field><Field label="Notes" wide><textarea rows={3} value={draft.notes??""} onChange={event=>setDraft({...draft,notes:event.target.value})}/></Field><label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={draft.active} onChange={event=>setDraft({...draft,active:event.target.checked})}/>Active</label></div><div className="mt-6 flex gap-3"><Button onClick={()=>void save()}>Save {entityType==="destination"?"fee":"rate"}</Button><Button variant="ghost" onClick={()=>{setEditing(null);setFormOpen(false);setDraft(empty)}}>Cancel</Button></div></div>}</section>;
}

function Field({label,wide,children}:{label:string;wide?:boolean;children:React.ReactNode}){return <label className={`grid gap-2 text-sm font-semibold ${wide?"md:col-span-2":""}`}>{label}<span className="[&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-stone/25 [&_input]:bg-white [&_input]:px-4 [&_input]:py-3 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-stone/25 [&_select]:bg-white [&_select]:px-4 [&_select]:py-3 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-stone/25 [&_textarea]:bg-white [&_textarea]:px-4 [&_textarea]:py-3">{children}</span></label>}
