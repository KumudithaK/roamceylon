export const staffPermissions=[
  "admin.dashboard.view",
  "journey.requests.view","journey.design.view","journey.design.edit","journey.lifecycle.manage","journey.lifecycle.override","journey.proposal.view","journey.proposal.create","journey.proposal.send","journey.proposal.manage",
  "suppliers.view","suppliers.manage","suppliers.allocate","suppliers.rates.view",
  "benefits.view","benefits.manage","benefits.assign","benefits.reference.view","benefits.reference.manage",
  "operations.view","operations.manage",
  "finance.revenue.view","finance.costs.view","finance.margin.view","finance.payments.manage","finance.settlements.reverse","finance.accounts.override",
  "traveller.pii.full.view","traveller.pii.design.view","traveller.pii.operations.view","traveller.pii.finance.view","traveller.context.suppliers.view",
  "audit.journey.view","audit.supplier.view","audit.finance.view","audit.operations.view","audit.security.view",
  "cms.view","cms.edit","users.manage","settings.manage"
] as const;

export type StaffPermission=(typeof staffPermissions)[number];
export type StaffRole="super_admin"|"journey_designer"|"partner_manager"|"operations"|"finance"|"content_marketing";

export const defaultRolePermissions:Record<StaffRole,readonly StaffPermission[]>={
  super_admin:staffPermissions,
  journey_designer:["admin.dashboard.view","journey.requests.view","journey.design.view","journey.design.edit","journey.lifecycle.manage","journey.proposal.view","journey.proposal.create","journey.proposal.send","suppliers.view","benefits.view","benefits.assign","traveller.pii.design.view","audit.journey.view"],
  partner_manager:["admin.dashboard.view","journey.requests.view","journey.design.view","suppliers.view","suppliers.manage","suppliers.allocate","suppliers.rates.view","benefits.view","benefits.manage","benefits.assign","benefits.reference.view","benefits.reference.manage","traveller.context.suppliers.view","audit.supplier.view"],
  operations:["admin.dashboard.view","journey.requests.view","journey.design.view","suppliers.view","operations.view","operations.manage","benefits.view","benefits.assign","traveller.pii.operations.view","audit.operations.view"],
  finance:["admin.dashboard.view","journey.requests.view","journey.design.view","journey.proposal.view","suppliers.view","suppliers.rates.view","benefits.view","benefits.reference.view","finance.revenue.view","finance.costs.view","finance.margin.view","finance.payments.manage","finance.settlements.reverse","traveller.pii.finance.view","audit.finance.view"],
  content_marketing:["admin.dashboard.view","cms.view","cms.edit"]
};

export const adminNavigationPermissions={
  overview:"admin.dashboard.view",enquiries:"journey.requests.view",studio:"journey.design.view",accounting:"finance.revenue.view",
  themes:"cms.view",destinations:"cms.view",experiences:"cms.view",stays:"suppliers.manage",vehicles:"suppliers.manage",
  guides:"suppliers.manage",partners:"suppliers.manage",benefits:"benefits.view",pricing:"settings.manage",partnerSettings:"settings.manage"
} as const satisfies Record<string,StaffPermission>;

export const hasStaffPermission=(permissions:Iterable<string>,permission:StaffPermission)=>new Set(permissions).has(permission);
export const hasAnyStaffPermission=(permissions:Iterable<string>,required:StaffPermission[])=>{const available=new Set(permissions);return required.some(permission=>available.has(permission))};
