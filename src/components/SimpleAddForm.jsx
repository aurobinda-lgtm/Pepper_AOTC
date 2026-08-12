// Generic collapsed "+ Add X" control that expands into a small config-driven
// form. Used wherever a full AddTaskForm-style component would be overkill
// for a handful of fields — Blockers, Risks, Decisions.
import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY2, LINE, OK, ff } from "../brand/tokens.js";

const inp = {
  boxSizing: "border-box", padding: "8px 11px", borderRadius: 9,
  border: `1.5px solid ${LINE}`, fontSize: 12.5, fontFamily: ff, color: INK,
  background: SURFACE, outline: "none",
};

export default function SimpleAddForm({ label, fields, onSubmit, mobile }) {
  const [open, setOpen] = useState(false);
  const initial = () => Object.fromEntries(fields.map((f) => [f.key, f.default ?? ""]));
  const [values, setValues] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  const requiredOk = fields.filter((f) => f.required).every((f) => String(values[f.key] ?? "").trim());

  const submit = async (e) => {
    e.preventDefault();
    if (!requiredOk) return;
    setSubmitting(true);
    await onSubmit(values);
    setSubmitting(false);
    setValues(initial());
    setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        fontSize: 12.5, fontWeight: 700, padding: "7px 16px", borderRadius: 10,
        border: `1.5px dashed ${LINE}`, background: SURFACE, color: GRAY2, cursor: "pointer", fontFamily: ff,
        marginBottom: 14,
      }}>+ {label}</button>
    );
  }

  return (
    <form onSubmit={submit} style={{ background: SURFACE, border: `1.5px solid ${INK}33`, borderRadius: 14,
                                       padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : `repeat(${Math.min(fields.length, 4)}, 1fr)`, gap: "10px 12px", marginBottom: 10 }}>
        {fields.map((f) => (
          <div key={f.key}>
            {f.type === "select" ? (
              <select value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} style={inp}>
                {f.options.map((o) => {
                  const v = o.value ?? o;
                  const l = o.label ?? o;
                  return <option key={v} value={v}>{l}</option>;
                })}
              </select>
            ) : (
              <input
                value={values[f.key]} onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder} type={f.type || "text"} style={inp}
              />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={submitting || !requiredOk} style={{
          fontSize: 12.5, fontWeight: 700, padding: "7px 18px", borderRadius: 10, border: "none",
          background: OK, color: "#fff", cursor: "pointer", fontFamily: ff, opacity: submitting || !requiredOk ? 0.6 : 1,
        }}>{submitting ? "Adding…" : `Add ${label.toLowerCase().replace(/^add /, "")}`}</button>
        <button type="button" onClick={() => { setOpen(false); setValues(initial()); }} style={{
          fontSize: 12.5, fontWeight: 700, padding: "7px 18px", borderRadius: 10, border: `1px solid ${LINE}`,
          background: PANEL, color: GRAY2, cursor: "pointer", fontFamily: ff,
        }}>Cancel</button>
      </div>
    </form>
  );
}
