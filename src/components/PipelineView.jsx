import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, OK_BG, RISK, ff, mono } from "../brand/tokens.js";
import { SUPABASE_CONFIGURED } from "../lib/supabaseClient.js";
import { useOpportunities, createOpportunity, updateOpportunity, useAccounts } from "../lib/queries.js";

const STAGES = [
  { key: "lead",        label: "Lead" },
  { key: "contacted",   label: "Contacted" },
  { key: "proposal",    label: "Proposal" },
  { key: "negotiation", label: "Negotiation" },
];

const inp = {
  width: "100%", boxSizing: "border-box", padding: "8px 11px", borderRadius: 9,
  border: `1.5px solid ${LINE}`, fontSize: 13, fontFamily: ff, color: INK,
  background: SURFACE, outline: "none",
};

export default function PipelineView({ addToast, mobile }) {
  const { data: oppsData, refetch } = useOpportunities();
  const opps = oppsData ?? [];
  const { data: accountsData } = useAccounts();
  const accounts = accountsData ?? [];

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");

  const open = opps.filter((o) => o.stage !== "won" && o.stage !== "lost");
  const won = opps.filter((o) => o.stage === "won");
  const lost = opps.filter((o) => o.stage === "lost");
  const weighted = open.reduce((s, o) => s + (Number(o.amount) || 0) * 0.35, 0);

  const submitOpp = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await createOpportunity({ name: name.trim(), accountId: accountId || null, amount: amount ? Number(amount) : null });
    if (error) { addToast("Could not create opportunity — try again"); return; }
    await refetch();
    addToast(`Opportunity "${name.trim()}" added`);
    setName(""); setAccountId(""); setAmount(""); setShowAdd(false);
  };

  const moveStage = async (opp, stage) => {
    const { data, error } = await updateOpportunity(opp.id, { stage });
    if (error) { addToast("Could not update stage — try again"); return; }
    await refetch();
    if (data?.createdProject) {
      addToast(`🎉 Won — delivery project "${data.createdProject.name}" created`);
    } else {
      addToast(`${opp.name} → ${stage}`);
    }
  };

  return (
    <div>
      {!SUPABASE_CONFIGURED && (
        <div style={{ fontSize: 11.5, color: GRAY2, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 10, padding: "8px 12px", marginBottom: 16 }}>
          Running in local/demo mode — the pipeline is saved in this browser until Supabase is connected.
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>◧ Pipeline</div>
          <div style={{ fontSize: 12, color: GRAY2, marginTop: 2, fontFamily: mono }}>
            {open.length} open · weighted ₹{Math.round(weighted).toLocaleString()} · {won.length} won · {lost.length} lost
          </div>
        </div>
        <button onClick={() => setShowAdd((s) => !s)} style={{
          marginLeft: "auto", fontSize: 13, fontWeight: 700, padding: "8px 18px", borderRadius: 12,
          border: "none", background: showAdd ? PANEL : INK, color: showAdd ? GRAY2 : "#fff",
          cursor: "pointer", fontFamily: ff,
        }}>{showAdd ? "✕ Cancel" : "+ Add opportunity"}</button>
      </div>

      {showAdd && (
        <form onSubmit={submitOpp} style={{ background: SURFACE, border: `1.5px solid ${INK}33`, borderRadius: 16, padding: 18, margin: "16px 0", display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 10, color: GRAY, fontFamily: mono, marginBottom: 4 }}>DEAL NAME *</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Inc — Website Rebuild" style={inp} autoFocus />
          </div>
          <div>
            <div style={{ fontSize: 10, color: GRAY, fontFamily: mono, marginBottom: 4 }}>ACCOUNT</div>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={inp}>
              <option value="">— none —</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: GRAY, fontFamily: mono, marginBottom: 4 }}>VALUE (₹)</div>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" style={inp} />
          </div>
          <button type="submit" disabled={!name.trim()} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: INK, color: "#fff", fontSize: 13, fontWeight: 700, cursor: name.trim() ? "pointer" : "default", fontFamily: ff, opacity: name.trim() ? 1 : 0.5 }}>Create</button>
        </form>
      )}

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)", gap: 12, marginTop: 18 }}>
        {STAGES.map((s, i) => {
          const rows = open.filter((o) => o.stage === s.key);
          return (
            <div key={s.key} style={{ background: PANEL, borderRadius: 14, padding: 12, minHeight: 120 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GRAY2, fontFamily: mono, textTransform: "uppercase", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                <span>{s.label}</span><span>{rows.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rows.map((o) => (
                  <div key={o.id} style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{o.name}</div>
                    {o.amount != null && <div style={{ fontSize: 11.5, color: GRAY2, fontFamily: mono, marginTop: 2 }}>₹{Number(o.amount).toLocaleString()}</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      {i < STAGES.length - 1 && (
                        <button onClick={() => moveStage(o, STAGES[i + 1].key)} style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 7, border: `1px solid ${LINE}`, background: SURFACE, color: GRAY2, cursor: "pointer", fontFamily: ff }}>{STAGES[i + 1].label} →</button>
                      )}
                      {s.key === "negotiation" && (
                        <button onClick={() => moveStage(o, "won")} style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 7, border: `1px solid ${OK}`, background: OK_BG, color: OK, cursor: "pointer", fontFamily: ff }}>Won ✓</button>
                      )}
                      <button onClick={() => moveStage(o, "lost")} style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 7, border: `1px solid ${LINE}`, background: SURFACE, color: RISK, cursor: "pointer", fontFamily: ff }}>Lost</button>
                    </div>
                  </div>
                ))}
                {rows.length === 0 && <div style={{ fontSize: 11.5, color: GRAY2, fontStyle: "italic" }}>Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
