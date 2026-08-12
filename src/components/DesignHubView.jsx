import { useEffect, useState } from "react";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, WARN, RISK, ff, mono } from "../brand/tokens.js";
import { useFeatures } from "../lib/queries.js";
import { getProfile } from "../lib/session.js";
import { SUPABASE_CONFIGURED } from "../lib/supabaseClient.js";
import { ALL_PROJECTS } from "../lib/access.js";
import TaskDetailExtras from "./TaskDetailExtras.jsx";
import TaskEditForm from "./TaskEditForm.jsx";
import AddTaskForm from "./AddTaskForm.jsx";
import MeetingsSection from "./MeetingsSection.jsx";

const HEALTH_COLOR = { green: OK, yellow: WARN, red: RISK };
const PRIORITY_COLOR = { P0: RISK, P1: WARN, P2: GRAY2, P3: GRAY };

// Deliberately company-wide — every task tagged category:"design" across
// every project, not just the projects the CDO is personally scoped to.
// That cross-cutting view is the whole point of a design hub.
export default function DesignHubView({ addToast, mobile, user }) {
  const [openId, setOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  useEffect(() => {
    if (SUPABASE_CONFIGURED) getProfile().then(setCurrentProfile);
    else if (user) setCurrentProfile({ id: user.name, name: user.name });
  }, [user]);

  const { data: featuresData, refetch: refetchFeatures } = useFeatures();
  const FEATURES = featuresData ?? [];
  const designTasks = FEATURES.filter((f) => f.category === "design");

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: ff }}>🎨 Design Hub</div>
        <div style={{ fontSize: 12, color: GRAY2, marginTop: 2, fontFamily: mono }}>
          Every design-tagged task, across every project — {designTasks.length} right now
        </div>
      </div>

      <AddTaskForm
        type="feature" defaultCategory="design" projectOptions={ALL_PROJECTS}
        addToast={addToast} mobile={mobile} onCreated={refetchFeatures}
      />

      <div style={{ background: SURFACE, border: `1.5px solid ${LINE}`, borderRadius: 18, overflow: "hidden", marginBottom: 16 }}>
        {designTasks.length === 0 ? (
          <div style={{ padding: "20px", fontSize: 13, color: GRAY2 }}>
            No tasks are tagged "design" yet — tag one when creating a task (Roadmap/Sprint/Bugs "+ Add" forms have a category field).
          </div>
        ) : designTasks.map((f, i) => {
          const isOpen = openId === f.id;
          return (
            <div key={f.id} style={{ borderBottom: i < designTasks.length - 1 ? `1px solid ${PANEL}` : "none", background: isOpen ? PANEL : "transparent" }}>
              <div onClick={() => setOpenId(isOpen ? null : f.id)} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "2fr 1fr 1fr 1fr 60px",
                                                                            padding: "13px 20px", gap: 12, alignItems: "center", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: GRAY2, marginTop: 2 }}>{f.project}</div>
                </div>
                {!mobile && <span style={{ fontSize: 12, color: GRAY2 }}>{f.owner}</span>}
                {!mobile && <span style={{ fontSize: 11, fontWeight: 800, color: PRIORITY_COLOR[f.priority], fontFamily: mono }}>{f.priority}</span>}
                {!mobile && <span style={{ fontSize: 11, fontWeight: 700, textTransform: "capitalize", color: GRAY2 }}>{f.status.replace("_", " ")}</span>}
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: HEALTH_COLOR[f.health], justifySelf: mobile ? "start" : "center" }} />
              </div>
              {isOpen && (
                <div style={{ padding: "0 20px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(editingId === f.id ? null : f.id); }} style={{
                      fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                      border: `1px solid ${LINE}`, background: editingId === f.id ? PANEL : SURFACE, color: GRAY2,
                      cursor: "pointer", fontFamily: ff,
                    }}>{editingId === f.id ? "Close editor" : "✎ Edit task"}</button>
                  </div>
                  {editingId === f.id && (
                    <TaskEditForm
                      task={f}
                      addToast={addToast}
                      mobile={mobile}
                      onCancel={() => setEditingId(null)}
                      onSaved={() => { setEditingId(null); refetchFeatures(); }}
                    />
                  )}
                  <TaskDetailExtras taskId={f.id} currentProfile={currentProfile} mobile={mobile} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <MeetingsSection addToast={addToast} mobile={mobile} />
    </div>
  );
}
