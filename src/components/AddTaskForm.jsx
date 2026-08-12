// Reusable "+ Add task" control. Every listing (Roadmap table, Board,
// Bugs, Sprint) creates through the same `createTask` mutation against the
// shared `tasks` table, so a task added anywhere shows up everywhere else
// it's relevant — no separate per-section data to keep in sync.
import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY2, LINE, OK, ff } from "../brand/tokens.js";
import { createTask, addTaskToSprint } from "../lib/queries.js";

const inp = {
  boxSizing: "border-box", padding: "8px 11px", borderRadius: 9,
  border: `1.5px solid ${LINE}`, fontSize: 12.5, fontFamily: ff, color: INK,
  background: SURFACE, outline: "none",
};

export default function AddTaskForm({
  type = "feature",           // "feature" | "bug"
  defaultStatus,
  defaultCategory = "general",
  projectOptions = [],
  sprintId,                   // when set, also links the new task into this sprint
  onCreated,
  addToast,
  mobile,
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [project, setProject] = useState(projectOptions[0] ?? "");
  const [owner, setOwner] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("P2");
  const [category, setCategory] = useState(defaultCategory);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const label = type === "bug" ? "bug" : "task";
  const status = defaultStatus ?? (type === "bug" ? "open" : "not_started");

  const reset = () => { setName(""); setOwner(""); setTargetDate(""); setPriority("P2"); setCategory(defaultCategory); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError("");
    const { data, error: createErr } = await createTask({
      project: project || null, name: name.trim(), type, status,
      owner: owner.trim() || null, targetDate: targetDate || null, priority, category,
      health: "yellow", openedDays: type === "bug" ? 0 : null,
    });
    if (createErr) { setSubmitting(false); setError(createErr.message || `Could not create the ${label}.`); return; }
    if (sprintId && data?.id) await addTaskToSprint(sprintId, data.id, { status: "todo" });
    setSubmitting(false);
    addToast?.(`✓ "${name.trim()}" added`);
    reset();
    setOpen(false);
    onCreated?.();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        fontSize: 12.5, fontWeight: 700, padding: "7px 16px", borderRadius: 10,
        border: `1.5px dashed ${LINE}`, background: SURFACE, color: GRAY2, cursor: "pointer", fontFamily: ff,
      }}>+ Add {label}</button>
    );
  }

  return (
    <form onSubmit={submit} style={{ background: SURFACE, border: `1.5px solid ${INK}33`, borderRadius: 14,
                                       padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "2fr 1fr 1fr", gap: "10px 12px", marginBottom: 10 }}>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={`What needs doing?`} style={inp} />
        <select value={project} onChange={e => setProject(e.target.value)} style={inp}>
          {projectOptions.length === 0 && <option value="">No space assigned</option>}
          {projectOptions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)} style={inp}>
          {["P0","P1","P2","P3"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: "10px 12px", marginBottom: 10 }}>
        <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Owner (optional)" style={inp} />
        {type !== "bug" && <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={inp} />}
        <select value={category} onChange={e => setCategory(e.target.value)} style={inp}>
          {["general","design","dev","marketing","consulting"].map(c => <option key={c} value={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}
        </select>
      </div>
      {error && <div style={{ fontSize: 11.5, color: "#C0392B", fontWeight: 600, marginBottom: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={submitting || !name.trim()} style={{
          fontSize: 12.5, fontWeight: 700, padding: "7px 18px", borderRadius: 10, border: "none",
          background: OK, color: "#fff", cursor: "pointer", fontFamily: ff, opacity: submitting || !name.trim() ? 0.6 : 1,
        }}>{submitting ? "Adding…" : `Add ${label}`}</button>
        <button type="button" onClick={() => { setOpen(false); reset(); }} style={{
          fontSize: 12.5, fontWeight: 700, padding: "7px 18px", borderRadius: 10, border: `1px solid ${LINE}`,
          background: PANEL, color: GRAY2, cursor: "pointer", fontFamily: ff,
        }}>Cancel</button>
      </div>
    </form>
  );
}
