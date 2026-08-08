export type AllocationFinancialLine={
  supplier_cost:number|null;
  selling_price:number|null;
  confirmation_status:string;
};

export type AllocationFinancialSummary={
  totalSupplierCost:number;
  totalSellingPrice:number;
  grossProfit:number;
  profitMargin:number;
  incompleteLines:number;
};

const money=(value:number)=>Math.round((value+Number.EPSILON)*100)/100;

export function allocationFinancialSummary(lines:AllocationFinancialLine[]):AllocationFinancialSummary{
  const active=lines.filter(line=>line.confirmation_status!=="cancelled");
  const totalSupplierCost=money(active.reduce((total,line)=>total+(line.supplier_cost??0),0));
  const totalSellingPrice=money(active.reduce((total,line)=>total+(line.selling_price??0),0));
  const grossProfit=money(totalSellingPrice-totalSupplierCost);
  return {
    totalSupplierCost,totalSellingPrice,grossProfit,
    profitMargin:totalSellingPrice?money(grossProfit/totalSellingPrice*100):0,
    incompleteLines:active.filter(line=>line.supplier_cost===null).length
  };
}
