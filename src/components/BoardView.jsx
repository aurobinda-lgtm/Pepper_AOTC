import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, WARN, RISK, ff, mono } from "../brand/tokens.js";
import { useFeatures, updateTask, useSpacesTree, createSpace, createFolder, createList } from "../lib/queries.js";
import { scopeByProject } from "../lib/access.js";

const COLUMNS = [
  { key: "not_started", label: "Not Started", color: GRAY },
  { key: "in_progress", label: "In Progress",  color: WARN },
  { key: "delayed",     label: "Delayed",      color: RISK },
  { key: "blocked",     label: "Blocked",      color: RISK },
  { key: "completed",   label: "Completed",    color: OK   },
];
const PRIORITY_COLOR = { P0: RISK, P1: WARN, P2: GRAY2, P3: GRAY };
const HEALTH_COLOR   = { green: OK, yellow: WARN, red: RISK };

const inp = {
  boxSizing: "border-box", padding: "6px 9px", borderRadius: 8,
  border: `1.5px solid ${LINE}`, fontSize: 12, fontFamily: ff, color: INK,
  background: SURFACE, outline: "none", width: "100%",
};

function TreeAdder({ placeholder, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  if (!open) return <button onClick={() => setOpen(true)} style={{ fontSize: 11, color: GRAY2, background: "none", border: "none", cursor: "pointer", fontFamily: ff, padding: "2px 0" }}>+ Add</button>;
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (val.trim()) onSubmit(val.trim()); setVal(""); setOpen(false); }} style={{ display: "flex", gap: 4, margin: "4px 0" }}>
      <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder} style={inp} />
      <button type="submit" style={{ ...inp, width: "auto", cursor: "pointer", fontWeight: 700, color: OK }}>✓</button>
    </form>
  );
}

function SpacesRail({ selectedList, onSelectList, mobile }) {
  const { data: tree, refetch } = useSpacesTree();
  const spaces = tree ?? [];

  return (
    <div style={{ background: SURFACE, border: `1.5px solid ${LINE}`, borderRadius: 16, padding: "14px 16px",
                  width: mobile ? "100%" : 240, flexShrink: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: GRAY, textTransform: "uppercase", letterSpacing: 0.8, fontFamily: mono, marginBottom: 10 }}>Spaces</div>
      <button onClick={() => onSelectList(null)} style={{
        display: "block", width: "100%", textAlign: "left", background: !selectedList ? PANEL : "none",
        border: "none", borderRadius: 8, padding: "5px 8px", fontSize: 12.5, fontWeight: 700, color: INK, cursor: "pointer", fontFamily: ff, marginBottom: 8,
      }}>◫ All tasks</button>

      {spaces.map((s) => (
        <div key={s.id} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: INK, padding: "3px 0" }}>{s.name}</div>
          {s.lists.map((l) => (
            <button key={l.id} onClick={() => onSelectList(l.id)} style={{
              display: "block", width: "100%", textAlign: "left", background: selectedList === l.id ? PANEL : "none",
              border: "none", borderRadius: 8, padding: "4px 8px", marginLeft: 10, fontSize: 12, color: GRAY2, cursor: "pointer", fontFamily: ff,
            }}>{l.name}</button>
          ))}
          {s.folders.map((f) => (
            <div key={f.id} style={{ marginLeft: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: GRAY2, padding: "3px 0" }}>📁 {f.name}</div>
              {f.lists.map((l) => (
                <button key={l.id} onClick={() => onSelectList(l.id)} style={{
                  display: "block", width: "100%", textAlign: "left", background: selectedList === l.id ? PANEL : "none",
                  border: "none", borderRadius: 8, padding: "4px 8px", marginLeft: 10, fontSize: 12, color: GRAY2, cursor: "pointer", fontFamily: ff,
                }}>{l.name}</button>
              ))}
              <div style={{ marginLeft: 10 }}><TreeAdder placeholder="New list…" onSubmit={(name) => createList(name, { folderId: f.id }).then(refetch)} /></div>
            </div>
          ))}
          <div style={{ marginLeft: 10 }}>
            <TreeAdder placeholder="New list…" onSubmit={(name) => createList(name, { spaceId: s.id }).then(refetch)} />
            <TreeAdder placeholder="New folder…" onSubmit={(name) => createFolder(s.id, name).then(refetch)} />
          </div>
        </div>
      ))}
      <div style={{ marginTop: 6, borderTop: `1px solid ${PANEL}`, paddingTop: 6 }}>
        <TreeAdder placeholder="New space…" onSubmit={(name) => createSpace(name).then(refetch)} />
      </div>
    </div>
  );
}

export default function BoardView({ addToast, mobile, user }) {
  const { data: features, refetch } = useFeatures();
  const FEATURES = scopeByProject(user, features ?? []);
  const [selectedList, setSelectedList] = useState(null);

  const visible = selectedList ? FEATURES.filter((f) => f.listId === selectedList) : FEATURES;

  const moveTask = async (task, nextStatus) => {
    await updateTask(task.id, { status: nextStatus });
    addToast(`"${task.name}" → ${COLUMNS.find((c) => c.key === nextStatus)?.label}`);
    refetch();
  };

  return (
    <div style={{ display: "flex", gap: 16, flexDirection: mobile ? "column" : "row", alignItems: "flex-start" }}>
      <SpacesRail selectedList={selectedList} onSelectList={setSelectedList} mobile={mobile} />

      <div style={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 12, minWidth: mobile ? "auto" : 900 }}>
          {COLUMNS.map((col) => {
            const items = visible.filter((f) => f.status === col.key);
            return (
              <div key={col.key} style={{ flex: "1 1 0", minWidth: 200, background: SURFACE, border: `1.5px solid ${LINE}`, borderRadius: 16, padding: "12px 14px" }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, color: col.color, fontFamily: mono, marginBottom: 10 }}>
                  {col.label} · {items.length}
                </div>
                {items.map((f) => (
                  <div key={f.id} style={{ background: PANEL, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: GRAY2, marginTop: 3 }}>{f.project} · {f.owner}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
                      <span style={{ fontSize: 9.5, fontWeight: 800, padding: "1px 6px", borderRadius: 5,
                                     background: `${PRIORITY_COLOR[f.priority]}22`, color: PRIORITY_COLOR[f.priority], fontFamily: mono }}>{f.priority}</span>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: HEALTH_COLOR[f.health] }} />
                      <select value={f.status} onChange={(e) => moveTask(f, e.target.value)} style={{ ...inp, width: "auto", marginLeft: "auto", fontSize: 10.5, padding: "2px 6px" }}>
                        {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div style={{ fontSize: 11.5, color: GRAY2 }}>—</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
