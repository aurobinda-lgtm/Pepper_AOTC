import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY2, LINE, OK, ff, mono } from "../brand/tokens.js";
import { getNotes, addNote, NOTE_CATEGORIES } from "../lib/execData.js";

const CATEGORY_LABEL = { product: "Product", plan: "Plan", general: "General" };

const inp = {
  boxSizing: "border-box", padding: "8px 11px", borderRadius: 9,
  border: `1.5px solid ${LINE}`, fontSize: 12.5, fontFamily: ff, color: INK,
  background: SURFACE, outline: "none",
};

export default function NotesSection({ addToast, mobile, user, title = "🗒 Notes & Plans" }) {
  // eslint-disable-next-line no-unused-vars
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const [filter, setFilter] = useState("all");
  const all = getNotes().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const rows = filter === "all" ? all : all.filter((n) => n.category === filter);

  const [showAdd, setShowAdd] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [project, setProject] = useState("");
  const [category, setCategory] = useState("general");
  const [body, setBody] = useState("");

  const reset = () => { setNoteTitle(""); setProject(""); setCategory("general"); setBody(""); };

  const submit = (e) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    addNote({ title: noteTitle.trim(), project: project.trim() || null, category, body: body.trim(), author: user?.name ?? "Unknown" });
    addToast?.(`✓ "${noteTitle.trim()}" saved`);
    reset();
    setShowAdd(false);
    refresh();
  };

  return (
    <div style={{ background: SURFACE, border: `1.5px solid ${LINE}`, borderRadius: 18, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>{title}</div>
        <div style={{ display: "flex", gap: 4, background: PANEL, borderRadius: 10, padding: 3 }}>
          {["all", ...NOTE_CATEGORIES].map((c) => (
            <button key={c} onClick={() => setFilter(c)} style={{
              padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: ff,
              fontSize: 11.5, fontWeight: 700, background: filter === c ? SURFACE : "transparent", color: filter === c ? INK : GRAY2,
            }}>{c === "all" ? "All" : CATEGORY_LABEL[c]}</button>
          ))}
        </div>
        <button onClick={() => setShowAdd((s) => !s)} style={{
          marginLeft: "auto", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 10,
          border: "none", background: showAdd ? PANEL : INK, color: showAdd ? GRAY2 : "#fff", cursor: "pointer", fontFamily: ff,
        }}>{showAdd ? "✕ Cancel" : "+ Add note"}</button>
      </div>

      {showAdd && (
        <form onSubmit={submit} style={{ background: PANEL, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "2fr 1fr 1fr", gap: "10px 12px", marginBottom: 10 }}>
            <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Title" style={inp} />
            <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project (optional)" style={inp} />
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inp}>
              {NOTE_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Write the note or plan…" style={{ ...inp, width: "100%", marginBottom: 10, resize: "vertical" }} />
          <button type="submit" style={{ fontSize: 12.5, fontWeight: 700, padding: "7px 18px", borderRadius: 10, border: "none", background: OK, color: "#fff", cursor: "pointer", fontFamily: ff }}>Save note</button>
        </form>
      )}

      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: GRAY2 }}>Nothing here yet — add the first note above.</div>
      ) : rows.map((n, i) => (
        <div key={n.id} style={{ padding: "10px 0", borderTop: i > 0 ? `1px solid ${PANEL}` : "none" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{n.title}</span>
            <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 5, background: PANEL, color: GRAY2, fontFamily: mono }}>{CATEGORY_LABEL[n.category]}</span>
            {n.project && <span style={{ fontSize: 11, color: GRAY2 }}>{n.project}</span>}
          </div>
          {n.body && <div style={{ fontSize: 12.5, color: INK, whiteSpace: "pre-wrap" }}>{n.body}</div>}
          <div style={{ fontSize: 10.5, color: GRAY2, marginTop: 4 }}>{n.author} · {new Date(n.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
        </div>
      ))}
    </div>
  );
}
