import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, OK_BG, WARN, WARN_BG, RISK, RISK_BG, ff, mono } from "../brand/tokens.js";
import { getInvoices, addInvoice, updateInvoice, invoiceSummary, INVOICE_STATUSES } from "../lib/execData.js";

const STATUS_COLOR = { draft: GRAY2, sent: WARN, paid: OK, overdue: RISK, void: GRAY };
const STATUS_BG = { draft: PANEL, sent: WARN_BG, paid: OK_BG, overdue: RISK_BG, void: PANEL };

const inp = {
  boxSizing: "border-box", padding: "8px 11px", borderRadius: 9,
  border: `1.5px solid ${LINE}`, fontSize: 12.5, fontFamily: ff, color: INK,
  background: SURFACE, outline: "none",
};
const fmt = (n) => n == null ? "—" : `₹${Number(n).toLocaleString("en-IN")}`;

export default function InvoicesSection({ addToast, mobile }) {
  // eslint-disable-next-line no-unused-vars -- setTick forces a re-render (and re-read) after a local-storage write
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const rows = getInvoices();
  const summary = invoiceSummary(rows);

  const [showAdd, setShowAdd] = useState(false);
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("sent");

  const reset = () => { setClient(""); setProject(""); setAmount(""); setIssueDate(""); setDueDate(""); setStatus("sent"); };

  const submit = (e) => {
    e.preventDefault();
    if (!client.trim() || !amount) return;
    addInvoice({ client: client.trim(), project: project.trim() || null, amount: Number(amount), issueDate: issueDate || null, dueDate: dueDate || null, status });
    addToast?.(`✓ Invoice for ${client.trim()} added`);
    reset();
    setShowAdd(false);
    refresh();
  };

  const markPaid = (inv) => {
    updateInvoice(inv.id, { status: "paid", paidDate: new Date().toISOString().slice(0, 10) });
    addToast?.(`✓ Marked "${inv.client}" invoice as paid`);
    refresh();
  };

  return (
    <div style={{ background: SURFACE, border: `1.5px solid ${LINE}`, borderRadius: 18, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>💰 Invoices & Payments</div>
        <button onClick={() => setShowAdd((s) => !s)} style={{
          marginLeft: "auto", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 10,
          border: "none", background: showAdd ? PANEL : INK, color: showAdd ? GRAY2 : "#fff", cursor: "pointer", fontFamily: ff,
        }}>{showAdd ? "✕ Cancel" : "+ Add invoice"}</button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {[["Sent on time", `${summary.onTimePct}%`, summary.onTimePct >= 80 ? OK : WARN],
          ["Received", fmt(summary.received), OK],
          ["Overdue", fmt(summary.overdue), summary.overdue > 0 ? RISK : OK],
          ["Invoices sent", summary.sentCount, GRAY2]].map(([label, value, color]) => (
          <div key={label} style={{ flex: "1 1 120px", background: PANEL, borderRadius: 12, padding: "10px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: mono }}>{value}</div>
            <div style={{ fontSize: 11, color: GRAY2, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {showAdd && (
        <form onSubmit={submit} style={{ background: PANEL, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: "10px 12px", marginBottom: 10 }}>
            <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client" style={inp} />
            <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project (optional)" style={inp} />
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (₹)" type="number" style={inp} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: "10px 12px", marginBottom: 10 }}>
            <input value={issueDate} onChange={(e) => setIssueDate(e.target.value)} type="date" style={inp} title="Issue date" />
            <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" style={inp} title="Due date" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inp}>
              {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button type="submit" style={{ fontSize: 12.5, fontWeight: 700, padding: "7px 18px", borderRadius: 10, border: "none", background: OK, color: "#fff", cursor: "pointer", fontFamily: ff }}>Add invoice</button>
        </form>
      )}

      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: GRAY2 }}>No invoices logged yet — add the first one above.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 560 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 90px 90px", gap: 10, padding: "6px 4px",
                        fontSize: 10, fontWeight: 800, color: GRAY, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: mono }}>
            <span>Client</span><span>Project</span><span>Amount</span><span>Due</span><span>Status</span><span></span>
          </div>
          {rows.map((inv, i) => (
            <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 90px 90px", gap: 10,
                                        padding: "10px 4px", alignItems: "center",
                                        borderTop: i > 0 ? `1px solid ${PANEL}` : "none" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{inv.client}</span>
              <span style={{ fontSize: 12, color: GRAY2 }}>{inv.project || "—"}</span>
              <span style={{ fontSize: 12.5, fontFamily: mono, color: INK }}>{fmt(inv.amount)}</span>
              <span style={{ fontSize: 12, color: GRAY2, fontFamily: mono }}>{inv.dueDate || "—"}</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 6, textAlign: "center",
                             background: STATUS_BG[inv.status], color: STATUS_COLOR[inv.status] }}>{inv.status}</span>
              {inv.status !== "paid" && inv.status !== "void" ? (
                <button onClick={() => markPaid(inv)} style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                                                                 border: `1px solid ${LINE}`, background: SURFACE, color: GRAY2, cursor: "pointer", fontFamily: ff }}>Mark paid</button>
              ) : <span />}
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}
