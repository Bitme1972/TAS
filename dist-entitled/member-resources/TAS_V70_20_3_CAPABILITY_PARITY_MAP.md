# TAS v70.20.3 Capability Parity Map

This map uses the supplied TAS v10.0.6 commercial desktop source as the capability reference and retains the v70.18 AURORA frontend as the web product identity.

## Core workflow parity

| Commercial desktop capability | AURORA web position | v70.20.3 status |
|---|---|---|
| Manual auditpol paste | Evidence Intake | Present |
| Static auditpol file import | Evidence Intake | Present in commercial build; fixed synthetic evidence in free Demo |
| Multi-asset bundle import | Evidence Intake | Present |
| Matrix/tabular parser support | Evidence Intake | Present |
| Parser diagnostics and unsafe-evidence handling | Evidence Intake and Trust Centre | Present |
| Detected asset, role and OS review | Evidence Intake | Present |
| Basic assurance | Assurance Results | Present |
| Advanced Plus assurance | Assurance Results | Present |
| Selected finding details | Lower Assurance Results pane | Strengthened in v70.20.3 |
| Result-row click selects detail | Raw grid and Golden matrix | Strengthened in v70.20.3 |
| Independent result/detail scrolling | Assurance Results | Strengthened in v70.20.3 |
| Resizable top and lower panes | Assurance Results splitter | Added in v70.20.3 |
| Golden baseline matrix | Assurance Results and Baseline Library | Present |
| Up to eight DCs against one Golden baseline | Premium Golden matrix | Present |
| Before and After comparison | Before / After | Present |
| Event ID intelligence | Event IDs | Present |
| Sortable Event ID table | Event IDs | Present |
| Event source and collection guidance | Event IDs | Present |
| Microsoft DC overlay | Assurance Results | Present |
| MITRE ATT&CK context and integrity | Assurance Results and Event IDs | Present |
| NIST SP 800-53, NIST CSF and CIS mapping | Findings and baseline library | Present |
| CSV action register | Output vault | Present |
| Detailed HTML evidence report | Output vault and report preview | Present |
| Printable PDF path | Output vault | Present through print-ready HTML |
| Word report | Output vault | Present |
| Golden baseline pack | Output vault | Present |
| Evidence provenance/hash metadata | Evidence Intake and Trust Centre | Present |
| Local collector handoff | Evidence Intake / standalone guidance | Present |
| Product activation request | Product Activation / desktop MSI | Present |
| Signed customer licence import | Desktop MSI | Present; browser metadata view is non-authoritative |
| Customer installer and hash sidecars | Entitled member vault | Added in v70.20.3 |
| Guided end-to-end demonstration | Member Gateway and download vault | Added in v70.20.3 |

## Interaction parity added in v70.20.3

The desktop reference explicitly uses visible horizontal and vertical scrollbars, a single selected findings row and a lower details pane whose data context updates immediately. The web build now reinforces the same behaviour without changing the protected AURORA source files:

1. Clicking or keyboard-activating a raw findings row opens **Selected finding details pane** and scrolls the detail content to the top.
2. Clicking a Golden matrix row or a specific server cell resolves the corresponding control and asset, selects the underlying finding and updates the lower pane.
3. The top matrix/grid pane and lower detail/report pane own independent scroll areas.
4. The horizontal splitter is draggable and keyboard accessible from 25% to 75%.
5. Selected Golden rows receive a visible focus/selection treatment.

## Free Demo boundary

The free Demo uses a separate synthetic engine and static evidence. It demonstrates navigation, interactions and reporting but does not ship the true commercial Golden baseline, protected control identifiers or customer evidence upload.

## Installer and licence boundary

The supplied MSI is staged under `release-assets` and copied only into the entitled-vault output. It is not copied into the public Cloudflare distribution. Online production delivery still requires authenticated server-side entitlement. The installed desktop application separately enforces the signed licence, edition, machine binding and permitted version.
