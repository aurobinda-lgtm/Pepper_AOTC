import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, ff, mono } from "../brand/tokens.js";

/**
 * TO / SUBJECT / BODY fields for an AI-drafted email. Read-only by default
 * with an explicit "✏ Edit" toggle (matching PulseView's DraftPanel) —
 * every place the app generates an email uses this, so the ability to edit
 * it before sending is always visible, not just implicitly available by
 * clicking into a field that happens to already be an input.
 */
export default function EmailDraftFields({
  to, subject, body, onChangeTo, onChangeSubject, onChangeBody,
  rows = 8, fieldBg = SURFACE, valueFont = ff,
}) {
  const [editing, setEditing] = useState(false);
  const stop = (e) => e.stopPropagation();

  const inputStyle = {
    width: "100%", fontSize: 13, fontFamily: valueFont, padding: "7px 10px", borderRadius: 8,
    border: `1.5px solid ${LINE}`, background: fieldBg, color: INK, outline: "none", boxSizing: "border-box",
  };
  const textareaStyle = { ...inputStyle, lineHeight: 1.6, resize: "vertical" };

  return (
    <div onClick={stop}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={(e) => { stop(e); setEditing((v) => !v); }} style={{
          fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 8,
          border: `1px solid ${LINE}`, background: editing ? INK : PANEL, color: editing ? "#fff" : GRAY2,
          cursor: "pointer", fontFamily: ff,
        }}>{editing ? "← Done editing" : "✏ Edit"}</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: GRAY, fontFamily: mono, marginBottom: 4 }}>TO</div>
          {editing
            ? <input value={to} onChange={(e) => onChangeTo(e.target.value)} onClick={stop} style={inputStyle} />
            : <div style={{ fontSize: 13, color: INK, fontWeight: 600 }}>{to}</div>}
        </div>
        <div>
          <div style={{ fontSize: 10, color: GRAY, fontFamily: mono, marginBottom: 4 }}>SUBJECT</div>
          {editing
            ? <input value={subject} onChange={(e) => onChangeSubject(e.target.value)} onClick={stop} style={inputStyle} />
            : <div style={{ fontSize: 13, color: INK, fontWeight: 600 }}>{subject}</div>}
        </div>
        <div>
          <div style={{ fontSize: 10, color: GRAY, fontFamily: mono, marginBottom: 4 }}>BODY</div>
          {editing
            ? <textarea value={body} onChange={(e) => onChangeBody(e.target.value)} onClick={stop} rows={rows} style={textareaStyle} />
            : <div style={{ fontSize: 12.5, color: INK, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{body}</div>}
        </div>
      </div>
    </div>
  );
}
