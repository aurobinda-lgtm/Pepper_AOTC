// Additive task-detail extras — comments, tags, checklist. Rendered inside
// an already-expanded task row (OperationsView); doesn't touch anything
// about how that row itself renders.
import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, ff, mono } from "../brand/tokens.js";
import {
  useTaskComments, addTaskComment,
  useTags, useTaskTags, createTag, addTagToTask, removeTagFromTask,
  useChecklist, addChecklistItem, toggleChecklistItem, deleteChecklistItem,
} from "../lib/queries.js";

const inp = {
  boxSizing: "border-box", padding: "7px 10px", borderRadius: 9,
  border: `1.5px solid ${LINE}`, fontSize: 12.5, fontFamily: ff, color: INK,
  background: SURFACE, outline: "none",
};

const TAG_COLORS = ["#1E9E72", "#B98427", "#C0392B", "#2E6F9E", "#7A5AB8", "#5D9E8E"];

function ChecklistSection({ taskId }) {
  const { data: items, refetch } = useChecklist(taskId);
  const rows = items ?? [];
  const [label, setLabel] = useState("");
  const done = rows.filter((i) => i.done).length;

  const submit = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    await addChecklistItem(taskId, label.trim(), rows.length);
    setLabel("");
    refetch();
  };

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: mono, marginBottom: 6 }}>
        Checklist {rows.length > 0 ? `${done}/${rows.length}` : ""}
      </div>
      {rows.map((item) => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
          <input type="checkbox" checked={item.done} onChange={async (e) => { await toggleChecklistItem(item.id, e.target.checked); refetch(); }} />
          <span style={{ flex: 1, fontSize: 12.5, color: item.done ? GRAY2 : INK, textDecoration: item.done ? "line-through" : "none" }}>{item.label}</span>
          <button onClick={async () => { await deleteChecklistItem(item.id); refetch(); }} style={{ background: "none", border: "none", color: GRAY2, cursor: "pointer", fontSize: 12 }}>✕</button>
        </div>
      ))}
      <form onSubmit={submit} style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Add checklist item…" style={{ ...inp, flex: 1 }} />
        <button type="submit" style={{ ...inp, cursor: "pointer", fontWeight: 700, color: OK }}>Add</button>
      </form>
    </div>
  );
}

function TagsSection({ taskId }) {
  const { data: allTags, refetch: refetchAll } = useTags();
  const { data: taskTags, refetch: refetchTaskTags } = useTaskTags(taskId);
  const active = taskTags ?? [];
  const activeIds = new Set(active.map((t) => t.id));
  const [newTag, setNewTag] = useState("");

  const toggle = async (tag) => {
    if (activeIds.has(tag.id)) await removeTagFromTask(taskId, tag.id);
    else await addTagToTask(taskId, tag.id);
    refetchTaskTags();
  };

  const submitNew = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const color = TAG_COLORS[(allTags?.length ?? 0) % TAG_COLORS.length];
    const { data: tag, error } = await createTag(newTag.trim(), color);
    setNewTag("");
    if (error || !tag) return;
    await addTagToTask(taskId, tag.id);
    refetchAll();
    refetchTaskTags();
  };

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: mono, marginBottom: 6 }}>Tags</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {(allTags ?? []).map((tag) => {
          const on = activeIds.has(tag.id);
          return (
            <button key={tag.id} onClick={() => toggle(tag)} style={{
              fontSize: 11, fontWeight: 700, padding: "3px 11px", borderRadius: 20, cursor: "pointer", fontFamily: ff,
              border: `1.5px solid ${on ? tag.color : LINE}`, background: on ? `${tag.color}22` : PANEL,
              color: on ? tag.color : GRAY2,
            }}>{tag.name}</button>
          );
        })}
      </div>
      <form onSubmit={submitNew} style={{ display: "flex", gap: 6 }}>
        <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag name…" style={{ ...inp, flex: 1 }} />
        <button type="submit" style={{ ...inp, cursor: "pointer", fontWeight: 700, color: OK }}>+ Tag</button>
      </form>
    </div>
  );
}

function CommentsSection({ taskId, currentProfile }) {
  const { data: comments, refetch } = useTaskComments(taskId);
  const rows = comments ?? [];
  const [body, setBody] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim() || !currentProfile) return;
    await addTaskComment(taskId, currentProfile.id, body.trim());
    setBody("");
    refetch();
  };

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: mono, marginBottom: 6 }}>
        Comments {rows.length > 0 ? `(${rows.length})` : ""}
      </div>
      {rows.map((c) => (
        <div key={c.id} style={{ padding: "6px 0", borderBottom: `1px solid ${PANEL}` }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: INK }}>{c.author}</div>
          <div style={{ fontSize: 12.5, color: INK, marginTop: 2 }}>{c.body}</div>
        </div>
      ))}
      {currentProfile ? (
        <form onSubmit={submit} style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a comment…" style={{ ...inp, flex: 1 }} />
          <button type="submit" style={{ ...inp, cursor: "pointer", fontWeight: 700, color: OK }}>Post</button>
        </form>
      ) : (
        <div style={{ fontSize: 11.5, color: GRAY2, marginTop: 6 }}>Sign in with a team account to comment.</div>
      )}
    </div>
  );
}

export default function TaskDetailExtras({ taskId, currentProfile, mobile }) {
  return (
    <div style={{ marginTop: 14, background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 12, padding: "14px 16px",
                  display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: 18 }}>
      <TagsSection taskId={taskId} />
      <ChecklistSection taskId={taskId} />
      <CommentsSection taskId={taskId} currentProfile={currentProfile} />
    </div>
  );
}
