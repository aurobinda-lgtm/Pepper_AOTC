// Generic inline task edit form — owner / status / priority / health / blocked / notes.
// Writes straight through via updateTask (no optimistic overlay), so it fits anywhere a
// lighter-weight edit affordance is enough — Bugs and Design Hub reuse this instead of each
// duplicating the richer overlay-state edit form Roadmap/Features already has.
import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, OK_BG, RISK, RISK_BG, ff, mono } from "../brand/tokens.js";
import { updateTask } from "../lib/queries.js";

const inp = {
  width: "100%", boxSizing: "border-box", padding: "8px 11px", borderRadius: 9,
  border: `1.5px solid ${LINE}`, fontSize: 13, fontFamily: ff, color: INK,
  background: SURFACE, outline: "none",
};

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: "uppercase",
                    letterSpacing: 0.6, fontFamily: mono, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

const DEFAULT_STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Done" },
  { value: "delayed",     label: "Delayed" },
  { value: "blocked",     label: "Blocked" },
];

export default function TaskEditForm({ task, statusOptions = DEFAULT_STATUS_OPTIONS, onSaved, onCancel, addToast, mobile }) {
  const [owner, setOwner] = useState(task.owner ?? "");
  const [status, setStatus] = useState(task.status ?? statusOptions[0]?.value);
  const [priority, setPriority] = useState(task.priority ?? "P2");
  const [health, setHealth] = useState(task.health ?? "yellow");
  const [blocked, setBlocked] = useState(!!task.blocked);
  const [risk, setRisk] = useState(task.risk ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await updateTask(task.id, {
      owner_label: owner.trim() || null, status, priority, health, blocked, risk_note: risk.trim() || null,
    });
    setSaving(false);
    addToast?.(`✓ "${task.name || task.title}" updated`);
    onSaved?.();
  };

  return (
    <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "14px 16px", marginTop: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr 1fr", gap: "10px 12px", marginBottom: 12 }}>
        <Field label="Owner">
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Unassigned" style={inp} />
        </Field>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={inp}>
            {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inp}>
            {["P0", "P1", "P2", "P3"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Health">
          <select value={health} onChange={(e) => setHealth(e.target.value)} style={inp}>
            <option value="green">Green</option>
            <option value="yellow">Yellow</option>
            <option value="red">Red</option>
          </select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 2fr", gap: "10px 12px", marginBottom: 12 }}>
        <Field label="Blocked">
          <button type="button" onClick={() => setBlocked((b) => !b)} style={{
            ...inp, textAlign: "left", cursor: "pointer", fontWeight: 700,
            color: blocked ? RISK : OK, background: blocked ? RISK_BG : OK_BG, border: "none",
          }}>{blocked ? "🚧 Blocked" : "✓ Not blocked"}</button>
        </Field>
        <Field label="Notes / risk">
          <input value={risk} onChange={(e) => setRisk(e.target.value)} placeholder="Optional note…" style={inp} />
        </Field>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save} disabled={saving} style={{
          fontSize: 12, fontWeight: 700, padding: "6px 16px", borderRadius: 10, border: "none",
          background: INK, color: "#fff", cursor: "pointer", fontFamily: ff, opacity: saving ? 0.6 : 1,
        }}>{saving ? "Saving…" : "💾 Save"}</button>
        <button type="button" onClick={onCancel} style={{
          fontSize: 12, fontWeight: 700, padding: "6px 16px", borderRadius: 10, border: `1.5px solid ${LINE}`,
          background: SURFACE, color: GRAY2, cursor: "pointer", fontFamily: ff,
        }}>Cancel</button>
      </div>
    </div>
  );
}
