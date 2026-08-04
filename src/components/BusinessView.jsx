import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, OK_BG, WARN, WARN_BG, RISK, RISK_BG, ff, mono } from "../brand/tokens.js";
import { CUSTOMER_METRICS, PRODUCT_USAGE, BUSINESS_METRICS, BUDGET } from "../data/pm_seed.js";

const fmt  = (n) => n == null ? "—" : n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${(n/1000).toFixed(0)}K`;
const fmtC = (n) => n.toLocaleString("en-IN");

const actBtn = (color, bg, outline) => ({
  fontSize:12, fontWeight:700, padding:"6px 14px", borderRadius:10,
  border:`1.5px solid ${outline ? LINE : color+"55"}`,
  background: bg, color, cursor:"pointer", fontFamily:ff,
  display:"inline-flex", alignItems:"center", gap:6, whiteSpace:"nowrap",
});
const miniBtn = (color) => ({
  fontSize:11, fontWeight:700, padding:"4px 11px", borderRadius:8,
  border:`1px solid ${color}55`, background:`${color}12`, color,
  cursor:"pointer", fontFamily:ff,
});

function DCell({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:700, color:GRAY, textTransform:"uppercase",
                    letterSpacing:0.6, fontFamily:mono, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:600, color:color||INK }}>{value}</div>
    </div>
  );
}

/* ── Generic inline-edit field used inside expanded rows ── */
function EditField({ label, value, display, color, onSave, hint }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState("");
  function open(e) { e.stopPropagation(); setDraft(value != null ? String(value) : ""); setEditing(true); }
  function save(e) {
    e && e.stopPropagation();
    const n = parseFloat(draft.replace(/[^0-9.\-]/g,""));
    if (!isNaN(n)) onSave(n);
    setEditing(false);
  }
  return (
    <div onClick={e=>e.stopPropagation()}>
      <div style={{ fontSize:10, fontWeight:700, color:GRAY, textTransform:"uppercase",
                    letterSpacing:0.6, fontFamily:mono, marginBottom:4 }}>{label}</div>
      {editing ? (
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") save(); if(e.key==="Escape") setEditing(false); }}
            placeholder={hint||"value"}
            style={{ width:90, fontSize:13, fontWeight:700, fontFamily:mono,
                     border:`1.5px solid ${color||INK}`, borderRadius:6, padding:"4px 8px",
                     background:SURFACE, color:INK, outline:"none" }} />
          <button onClick={save} style={{ ...miniBtn(OK), padding:"3px 8px" }}>✓</button>
          <button onClick={()=>setEditing(false)} style={{ ...miniBtn(GRAY2), padding:"3px 8px" }}>✕</button>
        </div>
      ) : (
        <div style={{ display:"flex", gap:8, alignItems:"center", cursor:"pointer" }} onClick={open}>
          <span style={{ fontSize:13, fontWeight:600, color:color||INK }}>{display ?? (value != null ? value : "—")}</span>
          <span style={{ fontSize:10, color:(color||INK)+"88", fontWeight:600 }}>✎ edit</span>
        </div>
      )}
    </div>
  );
}

/* ── Business KPI config ── */
const METRICS = [
  { key:"arr",         label:"ARR",          sub:"Annual recurring revenue", type:"currency", hint:"e.g. 3840000", color:()=>OK },
  { key:"mrr",         label:"MRR",          sub:"Monthly recurring revenue", type:"currency", hint:"e.g. 320000", color:()=>OK },
  { key:"churn",       label:"Churn",        sub:"Monthly churn rate",       type:"percent",  hint:"e.g. 1.8",    color:()=>WARN },
  { key:"trialToPaid", label:"Trial → Paid", sub:"Conversion rate",          type:"percent",  hint:"e.g. 34",     color:()=>WARN },
  { key:"renewalRisk", label:"Renewal Risk", sub:"accounts at risk",         type:"number",   hint:"count",       color:(has,v)=> has&&v>0?RISK:OK },
  { key:"nps",         label:"NPS",          sub:"Net promoter score",       type:"number",   hint:"-100 to 100", color:(has,v)=> has?(v>50?OK:WARN):GRAY2 },
];
const fmtMetric = (m,v) => v==null ? "—" : m.type==="currency" ? fmt(v) : m.type==="percent" ? `${v}%` : `${v}`;

/* ── Customer metrics config ── */
const CUST_METRICS = [
  { key:"openTickets",     label:"Open Tickets",     sub:"across all accounts",   hint:"count",  color:(v)=> v>40?RISK:WARN },
  { key:"criticalIssues",  label:"Critical Issues",  sub:"customer-reported",     hint:"count",  color:(v)=> v>0?RISK:OK },
  { key:"slaBreaches",     label:"SLA Breaches",     sub:"this month",            hint:"count",  color:(v)=> v>0?RISK:OK },
  { key:"featureRequests", label:"Feature Requests", sub:"this month",            hint:"count",  color:()=> WARN },
  { key:"highRiskAccounts",label:"High-Risk Accts",  sub:"churn risk",            hint:"count",  color:()=> RISK },
  { key:"csat",            label:"CSAT Score",       sub:"customer satisfaction", hint:"0-100",  color:(v)=> v!=null?(v>80?OK:WARN):GRAY2, isPercent:true },
];

const ARR_TREND = [
  {month:"Jan",arr:3200000},{month:"Feb",arr:3350000},{month:"Mar",arr:3480000},
  {month:"Apr",arr:3560000},{month:"May",arr:3700000},{month:"Jun",arr:3840000},
];

export default function BusinessView({ addToast = () => {}, mobile, tablet }) {
  const [tab, setTab] = useState("customers");
  const [openAcct,   setOpenAcct]   = useState(null);
  const [openFeat,   setOpenFeat]   = useState(null);
  const [openBudget, setOpenBudget] = useState(null);

  /* ── Customer metrics editable ── */
  const [custVals, setCustVals] = useState({
    openTickets:     CUSTOMER_METRICS.openTickets,
    criticalIssues:  CUSTOMER_METRICS.criticalIssues,
    slaBreaches:     CUSTOMER_METRICS.slaBreaches,
    featureRequests: CUSTOMER_METRICS.featureRequests,
    highRiskAccounts:CUSTOMER_METRICS.highRiskAccounts,
    csat:            CUSTOMER_METRICS.csat,
  });
  const [editingCust, setEditingCust] = useState(null);
  const [custDraft,   setCustDraft]   = useState("");

  function startCustEdit(m) { setCustDraft(custVals[m.key] != null ? String(custVals[m.key]) : ""); setEditingCust(m.key); }
  function saveCust(m) {
    const raw = parseFloat(custDraft.replace(/[^0-9.\-]/g,""));
    if (isNaN(raw)) { setEditingCust(null); return; }
    setCustVals(v => ({ ...v, [m.key]: raw }));
    setEditingCust(null);
    const disp = m.isPercent ? `${raw}%` : raw;
    addToast(`✓ ${m.label} updated to ${disp}`);
  }

  /* ── Business metrics editable ── */
  const [metricVals,    setMetricVals]    = useState({
    arr: BUSINESS_METRICS.arr ?? null,
    mrr: BUSINESS_METRICS.mrr ?? null,
    churn: BUSINESS_METRICS.churn ?? null,
    trialToPaid: BUSINESS_METRICS.trialToPaid ?? null,
    renewalRisk: BUSINESS_METRICS.renewalRisk ?? null,
    nps: BUSINESS_METRICS.nps ?? null,
  });
  const [editingMetric, setEditingMetric] = useState(null);
  const [metricDraft,   setMetricDraft]   = useState("");

  function startMetricEdit(m) { setMetricDraft(metricVals[m.key] != null ? String(metricVals[m.key]) : ""); setEditingMetric(m.key); }
  function saveMetric(m) {
    const raw = parseFloat(metricDraft.replace(/[^0-9.\-]/g,""));
    if (isNaN(raw)) { setEditingMetric(null); return; }
    setMetricVals(v => ({ ...v, [m.key]: raw }));
    setEditingMetric(null);
    addToast(`✓ ${m.label} updated to ${fmtMetric(m, raw)}`);
  }

  /* ── Usage editable ── */
  const [usageEdits, setUsageEdits] = useState({}); // { [feature]: { adoption?, target?, dau? } }
  function patchUsage(feature, field, val) {
    setUsageEdits(u => ({ ...u, [feature]: { ...(u[feature]||{}), [field]: val } }));
    addToast(`✓ ${feature} — ${field} updated to ${field==="dau" ? fmtC(val) : val+"%"}`);
  }

  /* ── Budget editable ── */
  const [budgetEdits, setBudgetEdits] = useState({}); // { [team]: { planned?, actual? } }
  function patchBudget(team, field, val) {
    setBudgetEdits(b => ({ ...b, [team]: { ...(b[team]||{}), [field]: val } }));
    addToast(`✓ ${team} — ${field} updated to ${fmt(val)}`);
  }
  function bVal(team, field) {
    return budgetEdits[team]?.[field] ?? BUDGET.find(b=>b.team===team)?.[field] ?? null;
  }

  const budgetRows = BUDGET.map(b => ({
    ...b,
    planned: bVal(b.team,"planned"),
    actual:  bVal(b.team,"actual"),
  }));
  const totalPlanned = budgetRows.reduce((s,b)=>s+(b.planned||0),0);
  const totalActual  = budgetRows.reduce((s,b)=>s+(b.actual||0),0);
  const overBudget   = budgetRows.filter(b=>b.actual!=null && b.planned!=null && b.actual>b.planned);

  return (
    <div>
      {/* sub-nav */}
      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {[["customers","👥 Customers"],["usage","📊 Usage"],["business","💰 Business"],["budget","📋 Budget"]].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} style={{
            padding: mobile ? "6px 14px" : "8px 20px", borderRadius:20, border:`1.5px solid ${tab===k?INK:LINE}`,
            background:tab===k?INK:SURFACE, color:tab===k?"#fff":GRAY2,
            fontSize: mobile ? 12 : 13, fontWeight:700, cursor:"pointer", fontFamily:ff,
          }}>{l}</button>
        ))}
      </div>

      {/* ════════ CUSTOMERS ════════ */}
      {tab === "customers" && (
        <div>
          {/* editable metric cards */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:20 }}>
            {CUST_METRICS.map(m => {
              const val    = custVals[m.key];
              const color  = typeof m.color === "function" ? m.color(val) : m.color;
              const display = m.isPercent ? (val != null ? `${val}%` : "—") : (val ?? "—");
              const isEditing = editingCust === m.key;
              return isEditing ? (
                <div key={m.key} style={{
                  flex:"1 1 130px", background:SURFACE, border:`1.5px solid ${color}`,
                  borderRadius:14, padding:"14px 16px", textAlign:"left", fontFamily:ff,
                  boxShadow:`0 0 0 3px ${color}22`,
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color, marginBottom:4 }}>{m.label}</div>
                  <div style={{ fontSize:10, color:GRAY2, marginBottom:6 }}>{m.hint}</div>
                  <input autoFocus value={custDraft} onChange={e=>setCustDraft(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter") saveCust(m); if(e.key==="Escape") setEditingCust(null); }}
                    placeholder={m.hint}
                    style={{ width:"100%", fontSize:18, fontWeight:800, fontFamily:mono,
                             border:`1.5px solid ${color}`, borderRadius:8, padding:"6px 10px",
                             background:SURFACE, color:INK, outline:"none", boxSizing:"border-box" }} />
                  <div style={{ display:"flex", gap:6, marginTop:8 }}>
                    <button onClick={()=>saveCust(m)} style={{ ...actBtn(OK, OK_BG), fontSize:11, padding:"4px 12px" }}>✓ Save</button>
                    <button onClick={()=>setEditingCust(null)} style={{ ...actBtn(GRAY2, SURFACE, true), fontSize:11, padding:"4px 12px" }}>✕</button>
                  </div>
                </div>
              ) : (
                <button key={m.key} onClick={()=>startCustEdit(m)} style={{
                  flex:"1 1 130px", background:SURFACE, border:`1.5px solid ${color}33`,
                  borderRadius:14, padding:"14px 16px", cursor:"pointer", textAlign:"left", fontFamily:ff,
                }}>
                  <div style={{ fontSize:26, fontWeight:900, color, fontFamily:mono }}>{display}</div>
                  <div style={{ fontSize:12, fontWeight:700, color, marginTop:2 }}>{m.label}</div>
                  <div style={{ fontSize:11, color:GRAY2, marginTop:3 }}>{m.sub}</div>
                  <div style={{ fontSize:10, color:color+"88", marginTop:6, fontWeight:600 }}>✎ Click to edit</div>
                </button>
              );
            })}
          </div>

          {/* account table */}
          <div style={{ overflowX:"auto", borderRadius:18 }}>
          <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, minWidth:480 }}>
            <div style={{ padding:"12px 20px", background:PANEL, borderRadius:"16px 16px 0 0",
                          display:"grid", gridTemplateColumns:"1.5fr 1fr 80px 80px 80px",
                          fontSize:10.5, fontWeight:800, color:GRAY, letterSpacing:0.8,
                          textTransform:"uppercase", fontFamily:mono, gap:12 }}>
              <span>Account</span><span>MRR</span><span>Tickets</span><span>SLA</span><span>Risk</span>
            </div>
            {CUSTOMER_METRICS.accounts.map((a,i) => {
              const riskCol = a.risk==="high"?RISK:a.risk==="medium"?WARN:OK;
              const slaCol  = a.sla==="breached"?RISK:OK;
              const isOpen  = openAcct === a.name;
              return (
                <div key={a.name} style={{ borderBottom:i<CUSTOMER_METRICS.accounts.length-1?`1px solid ${PANEL}`:"none",
                                           background: isOpen ? PANEL : a.risk==="high"?`${RISK}05`:"transparent" }}>
                  <div onClick={()=>setOpenAcct(o=>o===a.name?null:a.name)}
                       style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr 80px 80px 80px",
                                gap:12, padding:"13px 20px", alignItems:"center", cursor:"pointer" }}>
                    <span style={{ fontSize:14, fontWeight:700, color:INK, display:"flex", gap:7, alignItems:"center" }}>
                      <span style={{ fontSize:10, color:GRAY, transition:"transform .2s",
                                     transform:isOpen?"rotate(90deg)":"none", display:"inline-block" }}>▸</span>
                      {a.name}
                    </span>
                    <span style={{ fontSize:13, fontFamily:mono, color:INK }}>{fmt(a.mrr)}/mo</span>
                    <span style={{ fontSize:13, fontFamily:mono, color:a.tickets>10?RISK:GRAY2 }}>{a.tickets}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:slaCol,
                                   background:`${slaCol}22`, padding:"2px 8px", borderRadius:6,
                                   textAlign:"center" }}>{a.sla==="breached"?"Breached":"OK"}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:riskCol,
                                   background:`${riskCol}22`, padding:"2px 8px", borderRadius:6,
                                   textAlign:"center", textTransform:"capitalize" }}>{a.risk}</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding:"4px 20px 18px 37px" }}>
                      <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr 1fr":"repeat(4,1fr)", gap:"12px 18px",
                                    background:SURFACE, border:`1px solid ${LINE}`, borderRadius:12, padding:"14px 16px" }}>
                        <DCell label="Account" value={a.name} />
                        <DCell label="MRR" value={`${fmt(a.mrr)}/mo`} />
                        <DCell label="Open tickets" value={a.tickets} color={a.tickets>10?RISK:INK} />
                        <DCell label="ARR value" value={fmt(a.mrr*12)} />
                        <DCell label="SLA" value={a.sla==="breached"?"Breached":"On track"} color={slaCol} />
                        <DCell label="Churn risk" value={a.risk} color={riskCol} />
                      </div>
                      <div style={{ marginTop:12, display:"flex", gap:8, flexWrap:"wrap" }}>
                        <button onClick={()=>addToast(`📞 Outreach logged for ${a.name}`)} style={actBtn(INK, PANEL)}>📞 Contact account</button>
                        <button onClick={()=>addToast(`🎫 Opening ${a.tickets} ticket${a.tickets!==1?"s":""} for ${a.name}`)} style={actBtn(INK, PANEL)}>🎫 View tickets</button>
                        {(a.risk==="high" || a.sla==="breached") && (
                          <button onClick={()=>addToast(`🚩 ${a.name} escalated to account lead`)} style={actBtn(RISK, RISK_BG)}>🚩 Escalate</button>
                        )}
                        <button onClick={()=>addToast(`🤝 QBR scheduled with ${a.name}`)} style={actBtn(OK, OK_BG)}>🤝 Schedule QBR</button>
                        <button onClick={()=>addToast(`↗ Opening ${a.name} in CRM`)} style={actBtn(GRAY2, SURFACE, true)}>↗ Open in CRM</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {/* ════════ PRODUCT USAGE ════════ */}
      {tab === "usage" && (
        <div>
          <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18,
                        padding:"18px 20px", marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                          color:GRAY, fontFamily:mono, marginBottom:14 }}>Feature Adoption</div>
            {PRODUCT_USAGE.map((f,i) => {
              const edits   = usageEdits[f.feature] || {};
              const pct     = edits.adoption  ?? f.adoption;
              const target  = edits.target    ?? f.target;
              const dau     = edits.dau       ?? f.dau;
              const onTrack = pct >= target;
              const col     = onTrack ? OK : pct > target * 0.6 ? WARN : RISK;
              const isOpen  = openFeat === f.feature;
              return (
                <div key={f.feature} style={{ borderBottom:i<PRODUCT_USAGE.length-1?`1px solid ${PANEL}`:"none" }}>
                  <div onClick={()=>setOpenFeat(o=>o===f.feature?null:f.feature)} style={{ padding:"12px 0", cursor:"pointer" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, gap:8, flexWrap:"wrap" }}>
                      <div>
                        <span style={{ fontSize:10, color:GRAY, marginRight:6, transition:"transform .2s",
                                       transform:isOpen?"rotate(90deg)":"none", display:"inline-block" }}>▸</span>
                        <span style={{ fontSize:14, fontWeight:700, color:INK }}>{f.feature}</span>
                        <span style={{ fontSize:11, color:GRAY2, marginLeft:10, fontFamily:mono }}>released {f.released}</span>
                      </div>
                      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                        <span style={{ fontSize:11, color:GRAY2, fontFamily:mono }}>DAU: {fmtC(dau)}</span>
                        <span style={{ fontSize:13, fontWeight:800, color:col, fontFamily:mono }}>{pct}%</span>
                        <span style={{ fontSize:11, color:GRAY2 }}>/ {target}% target</span>
                        <span style={{ fontSize:13, color:f.trend==="up"?OK:f.trend==="down"?RISK:GRAY }}>
                          {f.trend==="up"?"↑":f.trend==="down"?"↓":"→"}
                        </span>
                      </div>
                    </div>
                    <div style={{ background:PANEL, borderRadius:6, height:8, overflow:"hidden" }}>
                      <div style={{ width:`${Math.min(pct,100)}%`, height:"100%", background:col, borderRadius:6 }} />
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding:"4px 0 14px 18px" }}>
                      {/* inline edit row */}
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px 18px",
                                    background:SURFACE, border:`1px solid ${LINE}`, borderRadius:12,
                                    padding:"14px 16px", marginBottom:10 }}>
                        <EditField label="Adoption %" value={pct} display={`${pct}%`} color={col}
                          hint="0–100" onSave={v=>patchUsage(f.feature,"adoption",v)} />
                        <EditField label="Target %" value={target} display={`${target}%`} color={GRAY2}
                          hint="0–100" onSave={v=>patchUsage(f.feature,"target",v)} />
                        <EditField label="Daily Active Users" value={dau} display={fmtC(dau)} color={INK}
                          hint="count" onSave={v=>patchUsage(f.feature,"dau",Math.round(v))} />
                      </div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        {!onTrack && <button onClick={()=>addToast(`📣 In-app promotion launched for "${f.feature}"`)} style={miniBtn(INK)}>📣 Promote feature</button>}
                        <button onClick={()=>addToast(`📊 Opening adoption analytics for "${f.feature}"`)} style={miniBtn(GRAY2)}>📊 View analytics</button>
                        <button onClick={()=>addToast(`🎯 Target updated for "${f.feature}" (now ${target}%)`)} style={miniBtn(WARN)}>🎯 Adjust target</button>
                        {f.trend==="down" && <button onClick={()=>addToast(`🔍 Churn investigation opened for "${f.feature}"`)} style={miniBtn(RISK)}>🔍 Investigate drop</button>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════ BUSINESS METRICS ════════ */}
      {tab === "business" && (
        <div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:20 }}>
            {METRICS.map(m => {
              const val    = metricVals[m.key];
              const hasVal = val != null;
              const color  = typeof m.color === "function" ? m.color(hasVal, val) : m.color;
              const isEditing = editingMetric === m.key;
              return isEditing ? (
                <div key={m.key} style={{
                  flex:"1 1 140px", background:SURFACE, border:`1.5px solid ${color}`,
                  borderRadius:14, padding:"14px 16px", textAlign:"left", fontFamily:ff,
                  boxShadow:`0 0 0 3px ${color}22`,
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color, marginBottom:4 }}>{m.label}</div>
                  <div style={{ fontSize:10, color:GRAY2, marginBottom:6 }}>{m.hint}</div>
                  <input autoFocus value={metricDraft} onChange={e=>setMetricDraft(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter") saveMetric(m); if(e.key==="Escape") setEditingMetric(null); }}
                    placeholder={m.hint}
                    style={{ width:"100%", fontSize:18, fontWeight:800, fontFamily:mono,
                             border:`1.5px solid ${color}`, borderRadius:8, padding:"6px 10px",
                             background:SURFACE, color:INK, outline:"none", boxSizing:"border-box" }} />
                  <div style={{ display:"flex", gap:6, marginTop:8 }}>
                    <button onClick={()=>saveMetric(m)} style={{ ...actBtn(OK, OK_BG), fontSize:11, padding:"4px 12px" }}>✓ Save</button>
                    <button onClick={()=>setEditingMetric(null)} style={{ ...actBtn(GRAY2, SURFACE, true), fontSize:11, padding:"4px 12px" }}>✕</button>
                  </div>
                </div>
              ) : (
                <button key={m.key} onClick={()=>startMetricEdit(m)} style={{
                  flex:"1 1 140px", background:SURFACE, border:`1.5px solid ${color}44`,
                  borderRadius:14, padding:"14px 16px", cursor:"pointer", textAlign:"left", fontFamily:ff,
                }}>
                  <div style={{ fontSize:26, fontWeight:900, color: hasVal ? color : GRAY2, fontFamily:mono }}>
                    {fmtMetric(m, val)}
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color, marginTop:2 }}>{m.label}</div>
                  <div style={{ fontSize:11, color:GRAY2, marginTop:3 }}>{m.sub}</div>
                  <div style={{ fontSize:10, color:color+"88", marginTop:6, fontWeight:600 }}>
                    {hasVal ? "✎ Click to edit" : "＋ Click to enter"}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, padding:"18px 20px" }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                          color:GRAY, fontFamily:mono, marginBottom:14 }}>ARR Trend — 6 months</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={ARR_TREND}>
                <defs>
                  <linearGradient id="arrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={OK} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={OK} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{fontSize:11,fill:GRAY}} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v=>`₹${(v/100000).toFixed(1)}L`} tick={{fontSize:10,fill:GRAY}} axisLine={false} tickLine={false} />
                <Tooltip formatter={v=>[fmt(v),"ARR"]} contentStyle={{fontSize:12,borderRadius:10,border:`1px solid ${LINE}`}} />
                <Area dataKey="arr" stroke={OK} strokeWidth={2.5} fill="url(#arrGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ════════ BUDGET ════════ */}
      {tab === "budget" && (
        <div>
          {/* summary — auto-computes from editable budget rows */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:20 }}>
            {[
              ["Total Planned", fmt(totalPlanned), GRAY2,  "FY budget"],
              ["Total Spent",   fmt(totalActual),  totalActual>totalPlanned?RISK:OK, `${totalPlanned?Math.round(totalActual/totalPlanned*100):0}% of plan`],
              ["Over Budget",   overBudget.length, overBudget.length>0?RISK:OK, "teams over budget"],
              ["Burn Rate",     fmt(totalActual/6)+"/mo", WARN, "avg monthly spend"],
            ].map(([label,value,color,sub]) => (
              <button key={label} onClick={()=>addToast(`📋 ${label}: ${value} — ${sub}`)}
                style={{ flex:"1 1 140px", background:SURFACE, border:`1.5px solid ${color}33`,
                         borderRadius:14, padding:"14px 16px", cursor:"pointer", textAlign:"left", fontFamily:ff }}>
                <div style={{ fontSize:24, fontWeight:900, color, fontFamily:mono }}>{value}</div>
                <div style={{ fontSize:12, fontWeight:700, color, marginTop:2 }}>{label}</div>
                <div style={{ fontSize:11, color:GRAY2, marginTop:3 }}>{sub}</div>
              </button>
            ))}
          </div>

          <div style={{ overflowX:"auto", borderRadius:18 }}>
          <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, minWidth:520 }}>
            <div style={{ padding:"12px 20px", background:PANEL, borderRadius:"16px 16px 0 0",
                          display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 80px",
                          fontSize:10.5, fontWeight:800, color:GRAY, letterSpacing:0.8,
                          textTransform:"uppercase", fontFamily:mono, gap:12 }}>
              <span>Team</span><span>Planned</span><span>Actual</span><span>Variance</span><span>Status</span>
            </div>
            {budgetRows.map((b,i) => {
              const hasData = b.actual != null && b.planned != null;
              const over   = hasData && b.actual > b.planned;
              const pct    = hasData ? Math.round((b.actual/b.planned)*100) : null;
              const col    = over ? RISK : OK;
              const isOpen = openBudget === b.team;
              return (
                <div key={b.team} style={{ borderBottom:i<budgetRows.length-1?`1px solid ${PANEL}`:"none",
                                           background: isOpen ? PANEL : over?`${RISK}05`:"transparent" }}>
                  <div onClick={()=>setOpenBudget(o=>o===b.team?null:b.team)}
                       style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 80px",
                                gap:12, padding:"13px 20px", alignItems:"center", cursor:"pointer" }}>
                    <span style={{ fontSize:14, fontWeight:700, color:INK, display:"flex", gap:7, alignItems:"center" }}>
                      <span style={{ fontSize:10, color:GRAY, transition:"transform .2s",
                                     transform:isOpen?"rotate(90deg)":"none", display:"inline-block" }}>▸</span>
                      {b.team}
                    </span>
                    <span style={{ fontSize:13, fontFamily:mono, color:GRAY2 }}>{fmt(b.planned)}</span>
                    <span style={{ fontSize:13, fontFamily:mono, color:col, fontWeight:700 }}>{fmt(b.actual)}</span>
                    <span style={{ fontSize:13, fontFamily:mono, color:over?RISK:OK, fontWeight:700 }}>
                      {hasData ? (over ? `+${fmt(b.actual-b.planned)}` : `-${fmt(b.planned-b.actual)}`) : "—"}
                    </span>
                    <span style={{ fontSize:11, fontWeight:700, color:col,
                                   background:`${col}22`, padding:"2px 8px",
                                   borderRadius:6, textAlign:"center" }}>{pct != null ? `${pct}%` : "—"}</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding:"4px 20px 18px 37px" }}>
                      {/* editable fields */}
                      <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr 1fr":"repeat(4,1fr)", gap:"12px 18px",
                                    background:SURFACE, border:`1px solid ${LINE}`, borderRadius:12, padding:"14px 16px" }}>
                        <DCell label="Team" value={b.team} />
                        <EditField label="Planned Budget" value={b.planned} display={fmt(b.planned)} color={GRAY2}
                          hint="₹ amount" onSave={v=>patchBudget(b.team,"planned",v)} />
                        <EditField label="Actual Spend" value={b.actual} display={fmt(b.actual)} color={col}
                          hint="₹ amount" onSave={v=>patchBudget(b.team,"actual",v)} />
                        <DCell label="Utilisation" value={pct!=null?`${pct}%`:"—"} color={col} />
                        <DCell label="Variance" value={hasData ? (over?`+${fmt(b.actual-b.planned)} over`:`${fmt(b.planned-b.actual)} under`) : "—"} color={over?RISK:OK} />
                        <DCell label="Status" value={over?"Over budget":"Within budget"} color={col} />
                      </div>
                      <div style={{ marginTop:12, display:"flex", gap:8, flexWrap:"wrap" }}>
                        {over ? (
                          <>
                            <button onClick={()=>addToast(`💰 Budget increase requested for ${b.team}`)} style={actBtn(INK, PANEL)}>💰 Request increase</button>
                            <button onClick={()=>addToast(`🚩 Overspend flagged for ${b.team} (${pct}%)`)} style={actBtn(RISK, RISK_BG)}>🚩 Flag overspend</button>
                          </>
                        ) : (
                          <button onClick={()=>addToast(`✓ Spend approved for ${b.team}`)} style={actBtn(OK, OK_BG)}>✓ Approve spend</button>
                        )}
                        <button onClick={()=>addToast(`📈 Reforecast started for ${b.team}`)} style={actBtn(WARN, WARN_BG)}>📈 Reforecast</button>
                        <button onClick={()=>addToast(`↗ Opening ${b.team} ledger`)} style={actBtn(GRAY2, SURFACE, true)}>↗ Open ledger</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
