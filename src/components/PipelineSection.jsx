import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY2, LINE, OK, WARN, RISK, ff, mono } from "../brand/tokens.js";
import { getOpportunities, addOpportunity, updateOpportunity, OPPORTUNITY_STAGES } from "../lib/execData.js";

const STAGE_LABEL = { lead: "Lead", contacted: "Contacted", proposal: "Proposal", negotiation: "Negotiation", won: "Won", lost: "Lost" };
const STAGE_COLOR = { lead: GRAY2, contacted: WARN, proposal: WARN, negotiation: WARN, won: OK, lost: RISK };
const fmt = (n) => n == null ? "—" : `₹${Number(n).toLocaleString("en-IN")}`;

const inp = {
  boxSizing: "border-box", padding: "8px 11px", borderRadius: 9,
  border: `1.5px solid ${LINE}`, fontSize: 12.5, fontFamily: ff, color: INK,
  background: SURFACE, outline: "none",
};

export default function PipelineSection({ addToast, mobile, title = "🚀 Pipeline & New Clients" }) {
  // eslint-disable-next-line no-unused-vars
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const [typeFilter, setTypeFilter] = useState("all"); // all | new_client | upsell
  const all = getOpportunities();
  const rows = typeFilter === "all" ? all : all.filter((o) => o.type === typeFilter);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState("new_client");
  const [stage, setStage] = useState("lead");
  const [amount, setAmount] = useState("");
  const [owner, setOwner] = useState("");
  const [closeDate, setCloseDate] = useState("");

  const reset = () => { setName(""); setCompany(""); setType("new_client"); setStage("lead"); setAmount(""); setOwner(""); setCloseDate(""); };

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addOpportunity({ name: name.trim(), company: company.trim() || null, type, stage, amount: amount ? Number(amount) : null, owner: owner.trim() || null, closeDate: closeDate || null });
    addToast?.(`✓ "${name.trim()}" added to pipeline`);
    reset();
    setShowAdd(false);
    refresh();
  };

  const moveStage = (opp, newStage) => {
    updateOpportunity(opp.id, { stage: newStage });
    addToast?.(`"${opp.name}" → ${STAGE_LABEL[newStage]}`);
    refresh();
  };

  const openValue = rows.filter((o) => o.stage !== "won" && o.stage !== "lost").reduce((s, o) => s + Number(o.amount || 0), 0);

  return (
    <div style={{ background: SURFACE, border: `1.5px solid ${LINE}`, borderRadius: 18, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>{title}</div>
        <div style={{ display: "flex", gap: 4, background: PANEL, borderRadius: 10, padding: 3 }}>
          {[["all", "All"], ["new_client", "New Client"], ["upsell", "Upsell"]].map(([k, l]) => (
            <button key={k} onClick={() => setTypeFilter(k)} style={{
              padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: ff,
              fontSize: 11.5, fontWeight: 700, background: typeFilter === k ? SURFACE : "transparent", color: typeFilter === k ? INK : GRAY2,
            }}>{l}</button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: GRAY2, fontFamily: mono }}>{fmt(openValue)} open</span>
        <button onClick={() => setShowAdd((s) => !s)} style={{
          marginLeft: "auto", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 10,
          border: "none", background: showAdd ? PANEL : INK, color: showAdd ? GRAY2 : "#fff", cursor: "pointer", fontFamily: ff,
        }}>{showAdd ? "✕ Cancel" : "+ Add deal"}</button>
      </div>

      {showAdd && (
        <form onSubmit={submit} style={{ background: PANEL, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: "10px 12px", marginBottom: 10 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Deal name" style={inp} />
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" style={inp} />
            <select value={type} onChange={(e) => setType(e.target.value)} style={inp}>
              <option value="new_client">New client</option>
              <option value="upsell">Upsell</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr 1fr", gap: "10px 12px", marginBottom: 10 }}>
            <select value={stage} onChange={(e) => setStage(e.target.value)} style={inp}>
              {OPPORTUNITY_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </select>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Value (₹)" type="number" style={inp} />
            <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner" style={inp} />
            <input value={closeDate} onChange={(e) => setCloseDate(e.target.value)} type="date" style={inp} title="Expected close" />
          </div>
          <button type="submit" style={{ fontSize: 12.5, fontWeight: 700, padding: "7px 18px", borderRadius: 10, border: "none", background: OK, color: "#fff", cursor: "pointer", fontFamily: ff }}>Add deal</button>
        </form>
      )}

      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: GRAY2 }}>Nothing in the pipeline yet — add the first deal above.</div>
      ) : rows.map((o, i) => (
        <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", flexWrap: "wrap",
                                  borderTop: i > 0 ? `1px solid ${PANEL}` : "none" }}>
          <div style={{ flex: "1 1 160px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{o.name}</div>
            <div style={{ fontSize: 11, color: GRAY2 }}>{o.company || "—"}{o.owner ? ` · ${o.owner}` : ""}</div>
          </div>
          <span style={{ fontSize: 12.5, fontFamily: mono, color: INK, minWidth: 80, textAlign: "right" }}>{fmt(o.amount)}</span>
          <span style={{ fontSize: 11, color: GRAY2, fontFamily: mono, minWidth: 80 }}>{o.closeDate || "—"}</span>
          <select value={o.stage} onChange={(e) => moveStage(o, e.target.value)} style={{
            ...inp, width: "auto", fontSize: 11, padding: "4px 8px", fontWeight: 700, color: STAGE_COLOR[o.stage],
          }}>
            {OPPORTUNITY_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
