import { useState } from "react";
import { INK, PANEL, GRAY, GRAY2, LINE, ff, mono } from "../brand/tokens.js";
import { getProjectBrief } from "../lib/queries.js";

/** A computed-facts-first narrative for one project — generated on demand,
 *  never automatically on render (an LLM call per card on every dashboard
 *  load would be both slow and needlessly expensive). */
export default function ProjectBrief({ projectId }) {
  const [state, setState] = useState(null); // { narrative, facts } | "loading" | { error }
  const [open, setOpen] = useState(false);

  const generate = async (e) => {
    e.stopPropagation();
    setOpen(true);
    setState("loading");
    const { data, error } = await getProjectBrief(projectId);
    if (error) { setState({ error: error.message || "Could not generate a brief — try again." }); return; }
    setState(data);
  };

  if (!open) {
    return (
      <button onClick={generate} style={{
        fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 8,
        border: `1.5px solid ${LINE}`, background: "transparent", color: GRAY2,
        cursor: "pointer", fontFamily: ff,
      }}>🌶 Ask Pepper for a brief</button>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ background: PANEL, borderRadius: 10, padding: "10px 12px", marginTop: 4 }}>
      {state === "loading" && <div style={{ fontSize: 12, color: GRAY2 }}>Reading project activity…</div>}
      {state?.error && <div style={{ fontSize: 12, color: "#A23F3F" }}>{state.error}</div>}
      {state?.narrative && (
        <>
          <div style={{ fontSize: 12.5, color: INK, lineHeight: 1.55 }}>{state.narrative}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 9.5, color: GRAY, fontFamily: mono, textTransform: "uppercase" }}>
              {state.facts?.progressPct}% done · {state.facts?.overdueTasks} overdue · {state.facts?.blockedTasks} blocked
            </span>
            <button onClick={generate} style={{ fontSize: 10.5, fontWeight: 700, color: GRAY2, background: "none", border: "none", cursor: "pointer", fontFamily: ff, textDecoration: "underline" }}>Regenerate</button>
          </div>
        </>
      )}
    </div>
  );
}
