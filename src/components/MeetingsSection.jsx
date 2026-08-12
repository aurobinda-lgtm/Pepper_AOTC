import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, WARN, ff, mono } from "../brand/tokens.js";
import { getMeetings, addMeeting, updateMeeting } from "../lib/execData.js";

const inp = {
  boxSizing: "border-box", padding: "8px 11px", borderRadius: 9,
  border: `1.5px solid ${LINE}`, fontSize: 12.5, fontFamily: ff, color: INK,
  background: SURFACE, outline: "none",
};

function MeetingRow({ meeting, refresh, addToast }) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [draft, setDraft] = useState(meeting.notes || "");
  const isPast = new Date(meeting.date) < new Date(new Date().toDateString());

  const saveNotes = () => {
    updateMeeting(meeting.id, { notes: draft });
    addToast?.(`✓ Notes saved for "${meeting.title}"`);
    setEditingNotes(false);
    refresh();
  };

  return (
    <div style={{ padding: "10px 0", borderTop: `1px solid ${PANEL}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 6, fontFamily: mono,
                       background: isPast ? PANEL : `${WARN}22`, color: isPast ? GRAY2 : WARN, flexShrink: 0 }}>{meeting.date}</span>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{meeting.title}</div>
          <div style={{ fontSize: 11, color: GRAY2, marginTop: 1 }}>
            {(meeting.attendees || []).join(", ") || "No attendees listed"}{meeting.project ? ` · ${meeting.project}` : ""}
          </div>
        </div>
        {!editingNotes && (
          <button onClick={() => setEditingNotes(true)} style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                                                                   border: `1px solid ${LINE}`, background: SURFACE, color: GRAY2, cursor: "pointer", fontFamily: ff }}>
            {meeting.notes ? "Edit notes" : "Add notes"}
          </button>
        )}
      </div>
      {meeting.notes && !editingNotes && (
        <div style={{ fontSize: 12.5, color: INK, marginTop: 8, marginLeft: 68, whiteSpace: "pre-wrap" }}>{meeting.notes}</div>
      )}
      {editingNotes && (
        <div style={{ marginTop: 8, marginLeft: 68 }}>
          <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} rows={3}
            placeholder="What happened, decisions made, action items…"
            style={{ ...inp, width: "100%", resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button onClick={saveNotes} style={{ fontSize: 11.5, fontWeight: 700, padding: "5px 14px", borderRadius: 8, border: "none", background: OK, color: "#fff", cursor: "pointer", fontFamily: ff }}>Save</button>
            <button onClick={() => setEditingNotes(false)} style={{ fontSize: 11.5, fontWeight: 700, padding: "5px 14px", borderRadius: 8, border: `1px solid ${LINE}`, background: SURFACE, color: GRAY2, cursor: "pointer", fontFamily: ff }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MeetingsSection({ addToast, mobile }) {
  // eslint-disable-next-line no-unused-vars
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const all = getMeetings().sort((a, b) => new Date(a.date) - new Date(b.date));
  const today = new Date(new Date().toDateString());
  const upcoming = all.filter((m) => new Date(m.date) >= today);
  const past = all.filter((m) => new Date(m.date) < today).reverse();

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [attendees, setAttendees] = useState("");
  const [project, setProject] = useState("");

  const reset = () => { setTitle(""); setDate(""); setAttendees(""); setProject(""); };

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    addMeeting({ title: title.trim(), date, attendees: attendees.split(",").map((a) => a.trim()).filter(Boolean), project: project.trim() || null });
    addToast?.(`✓ "${title.trim()}" scheduled`);
    reset();
    setShowAdd(false);
    refresh();
  };

  return (
    <div style={{ background: SURFACE, border: `1.5px solid ${LINE}`, borderRadius: 18, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>🗓 Meetings</div>
        <button onClick={() => setShowAdd((s) => !s)} style={{
          marginLeft: "auto", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 10,
          border: "none", background: showAdd ? PANEL : INK, color: showAdd ? GRAY2 : "#fff", cursor: "pointer", fontFamily: ff,
        }}>{showAdd ? "✕ Cancel" : "+ Schedule / log"}</button>
      </div>

      {showAdd && (
        <form onSubmit={submit} style={{ background: PANEL, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "2fr 1fr 1fr", gap: "10px 12px", marginBottom: 10 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting title" style={inp} />
            <input value={date} onChange={(e) => setDate(e.target.value)} type="date" style={inp} />
            <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project (optional)" style={inp} />
          </div>
          <input value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="Attendees, comma separated" style={{ ...inp, width: "100%", marginBottom: 10 }} />
          <button type="submit" style={{ fontSize: 12.5, fontWeight: 700, padding: "7px 18px", borderRadius: 10, border: "none", background: OK, color: "#fff", cursor: "pointer", fontFamily: ff }}>Save</button>
        </form>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: mono, marginBottom: 4 }}>
        Upcoming — {upcoming.length}
      </div>
      {upcoming.length === 0 ? <div style={{ fontSize: 12.5, color: GRAY2, padding: "6px 0" }}>Nothing scheduled.</div>
        : upcoming.map((m) => <MeetingRow key={m.id} meeting={m} refresh={refresh} addToast={addToast} />)}

      <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: mono, margin: "14px 0 4px" }}>
        Past — {past.length}
      </div>
      {past.length === 0 ? <div style={{ fontSize: 12.5, color: GRAY2, padding: "6px 0" }}>Nothing logged yet.</div>
        : past.map((m) => <MeetingRow key={m.id} meeting={m} refresh={refresh} addToast={addToast} />)}
    </div>
  );
}
