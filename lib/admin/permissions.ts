export const staffPermissions=[
  "journey.requests.view","journey.design.view","journey.design.edit","journey.proposal.view","journey.proposal.create",
  "suppliers.view","suppliers.manage","suppliers.allocate","suppliers.rates.view",
  "operations.view","operations.manage",
  "finance.revenue.view","finance.costs.view","finance.margin.view","finance.payments.manage",
  "cms.view","cms.edit","users.manage","settings.manage"
] as const;

export type StaffPermission=(typeof staffPermissions)[number];
export type StaffRole="super_admin"|"journey_designer"|"partner_manager"|"operations"|"finance"|"content_marketing";

export const defaultRolePermissions:Record<StaffRole,readonly StaffPermission[]>={
  super_admin:staffPermissions,
  journey_designer:["journey.requests.view","journey.design.view","journey.design.edit","journey.proposal.view","journey.proposal.create","suppliers.view"],
  partner_manager:["journey.requests.view","journey.design.view","suppliers.view","suppliers.manage","suppliers.allocate","suppliers.rates.view"],
  operations:["journey.requests.view","journey.design.view","suppliers.view","operations.view","operations.manage"],
  finance:["journey.requests.view","journey.design.view","journey.proposal.view","suppliers.view","suppliers.rates.view","finance.revenue.view","finance.costs.view","finance.margin.view","finance.payments.manage"],
  content_marketing:["cms.view","cms.edit"]
};

export const adminNavigationPermissions={
  overview:"journey.requests.view",enquiries:"journey.requests.view",studio:"journey.design.view",accounting:"finance.revenue.view",
  themes:"cms.view",destinations:"cms.view",experiences:"cms.view",stays:"suppliers.view",vehicles:"suppliers.view",
  guides:"suppliers.view",partners:"suppliers.view",pricing:"settings.manage",partnerSettings:"settings.manage"
} as const satisfies Record<string,StaffPermission>;

export const hasStaffPermission=(permissions:Iterable<string>,permission:StaffPermission)=>new Set(permissions).has(permission);
export const hasAnyStaffPermission=(permissions:Iterable<string>,required:StaffPermission[])=>{const available=new Set(permissions);return required.some(permission=>available.has(permission))};
