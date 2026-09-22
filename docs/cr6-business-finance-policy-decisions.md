# CR6 BUSINESS FINANCE POLICY DECISIONS

This is a decision register, not an adopted pricing policy. **SYSTEM READY** describes existing technical capability only; **FOUNDER POLICY REQUIRED** means no value, percentage, rule or authority has been invented.

| Area | SYSTEM READY | FOUNDER POLICY REQUIRED |
| --- | --- | --- |
| Default pricing approach | Supplier cost, operations, fees, margin target and manual selling floor can produce a server-side proposal snapshot. | Choose who approves a bespoke quote and when manual selling overrides are permitted. |
| Target and minimum margin | Code distinguishes actual gross margin from markup and shows the realized result. | Approve target, any floor, exception authority and review cadence; configure non-null settings. |
| Discounts | No active authorized proposal discount API; manual selling can change actual margin. | Decide whether to offer fixed/percentage discounts, approval thresholds, recording and audit. Do not call manual selling a discount until defined. |
| Traveller deposit | Positive deposit amount and derived balance can be snapshotted; invalid over-total or fractional-cent deposits are now rejected. | Choose amount/percentage, when required, and exception rules. |
| Final balance timing | Deposit/balance dates can be recorded; ordering is checked. | Choose due-date rule, extension authority and collection process. |
| Cancellation/refund | Guarded, compensating financial transactions exist. | Set terms, penalties, approval, evidence and timing, subject to legal review. |
| Accepted traveller currencies | Proposal allocations must have a single currency; settlement currency is checked. | Select the initial selling/settlement currency or currencies. |
| FX | No conversion or historical FX snapshot. | Choose whether to prohibit mixed-currency supplier terms for launch or commission a controlled FX design. No rate is assumed. |
| Supplier deposit/payment | Expected cost, payable and paid are distinct; settlements activate after first traveller deposit. | Approve when suppliers are paid, deposits, partial settlement, evidence and authority. |
| Payment methods | Manual payment accounting exists; no gateway is required by this phase. | Approve accepted methods, bank/payment instructions and who may communicate them. |
| Manual payment verification | RBAC, idempotency and immutable postings support controlled entry. | Assign verifier, dual-control if needed, reference/evidence and reconciliation frequency. |
| Invoice/receipt handling | Proposal and account data exist; operational/accounting attachments exist. | Accountant/legal to approve invoice/receipt format, tax content, issuing entity, numbering and retention. |
| Refund authority | Guarded refund command checks net received. | Approve who authorizes, who executes, limits, customer communication and reconciliation. |
| Tax/fees | Some configurable commercial costs exist, currently blank. | Accountant/legal to determine applicable taxes, fees and presentation; do not invent amounts. |
| Precision | Application rounds many calculations to cents; proposal deposit now validated. | Approve reviewed database/API minor-unit enforcement before paid operation. |

### Decision gate

No real payment, traveller deposit, supplier payable, invoice or refund is authorized by this document. Founder decisions, verified CR5 supplier rates, the reviewed precision change, and CR8/accountant/legal sign-off are separate prerequisites for commercial launch.
