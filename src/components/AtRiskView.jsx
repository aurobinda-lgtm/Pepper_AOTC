/**
 * AtRiskView — unhappy / at-risk client deep-dive.
 *
 * Data sources (mock today, real tomorrow):
 *   Outlook  → recent email threads via fetchOutlookThreads()
 *   Fireflies → meeting transcripts + action items via fetchFirefliesNotes()
 *   Seed      → project health, last-contact days
 *
 * To wire up live data: update src/lib/integrations.js — no changes needed here.
 */

import { useState, useEffect } from "react";
import { INK, INK2, PAPER, SURFACE, PANEL, GRAY, GRAY2, MUTED, LINE,
         OK, OK_BG, WARN, WARN_BG, RISK, RISK_BG, HEALTH, ff, mono } from "../brand/tokens.js";
import { fetchOutlookThreads, fetchFirefliesNotes, getRecommendations,
         daysAgo, SENTIMENT_LABEL } from "../lib/integrations.js";

const PRIORITY_COLOR = {
  urgent: { border: "#F2C4BC", bg: RISK_BG,  dot: RISK,  label: "Urgent"  },
  watch:  { border: "#A8D8C6", bg: WARN_BG,  dot: WARN,  label: "Watch"   },
  ok:     { border: LINE,      bg: OK_BG,    dot: OK,    label: "OK"      },
};

function EmailThread({ thread }) {
  const [open, setOpen] = useState(false);
  const s = SENTIMENT_LABEL[thread.sentiment] ?? SENTIMENT_LABEL.unknown;
  return (
    <div style={{ borderBottom: `1px solid ${PANEL}`, paddingBottom: 12, marginBottom: 12 }}>
      <div onClick={() => setOpen(o => !o)}
           style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
        {/* unread dot */}
        <span style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                       background: thread.unread ? RISK : "transparent",
                       border: thread.unread ? "none" : `1.5px solid ${LINE}` }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13.5, fontWeight: thread.unread ? 800 : 600, color: INK }}>{thread.subject}</span>
            {thread.requiresReply && (
              <span style={{ fontSize: 10.5, background: RISK_BG, color: RISK, fontWeight: 700,
                             padding: "2px 8px", borderRadius: 8, fontFamily: mono }}>Needs reply</span>
            )}
            <span style={{ fontSize: 10.5, background: s.bg, color: s.color, fontWeight: 700,
                           padding: "2px 8px", borderRadius: 8, fontFamily: mono }}>{s.label}</span>
          </div>
          <div style={{ fontSize: 11.5, color: GRAY2, marginTop: 2 }}>
            {thread.fromName} · {daysAgo(thread.receivedAt)}
          </div>
          {open && (
            <div style={{ marginTop: 8, fontSize: 13, color: GRAY2, lineHeight: 1.65,
                          background: PANEL, borderRadius: 10, padding: "10px 12px" }}>
              "{thread.preview}"
            </div>
          )}
        </div>
        <span style={{ fontSize: 10, color: GRAY, flexShrink: 0,
                       transform: open ? "rotate(180deg)" : "none", transition: ".15s" }}>▾</span>
      </div>
    </div>
  );
}

function MeetingCard({ meeting }) {
  const [open, setOpen] = useState(false);
  const s = SENTIMENT_LABEL[meeting.sentiment] ?? SENTIMENT_LABEL.unknown;
  const pendingActions = meeting.actionItems.filter(a => !a.done);
  return (
    <div style={{ border: `1.5px solid ${LINE}`, borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>
      <div onClick={() => setOpen(o => !o)}
           style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer" }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🎙</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{meeting.title}</span>
            <span style={{ fontSize: 10.5, background: s.bg, color: s.color, fontWeight: 700,
                           padding: "2px 8px", borderRadius: 8, fontFamily: mono }}>{s.label}</span>
            {pendingActions.length > 0 && (
              <span style={{ fontSize: 10.5, background: WARN_BG, color: WARN, fontWeight: 700,
                             padding: "2px 8px", borderRadius: 8, fontFamily: mono }}>
                {pendingActions.length} open action{pendingActions.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: GRAY2, marginTop: 2 }}>
            {daysAgo(meeting.date)} · {meeting.durationMins} min · {meeting.attendees.join(", ")}
          </div>
        </div>
        <span style={{ fontSize: 10, color: GRAY, flexShrink: 0,
                       transform: open ? "rotate(180deg)" : "none", transition: ".15s" }}>▾</span>
      </div>

      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          {/* key moments */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
                        color: GRAY, fontFamily: mono, marginBottom: 8 }}>Key moments</div>
          <div style={{ marginBottom: 14 }}>
            {meeting.keyMoments.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: INK, color: "#fff",
                              fontSize: 9.5, fontWeight: 700, flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {m.speaker.split(" ").map(w => w[0]).join("").slice(0,2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: GRAY2, marginBottom: 2 }}>{m.speaker}</div>
                  <div style={{ fontSize: 13, color: INK, lineHeight: 1.55,
                                fontStyle: "italic" }}>"{m.text}"</div>
                </div>
              </div>
            ))}
          </div>

          {/* action items */}
          {meeting.actionItems.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
                            color: GRAY, fontFamily: mono, marginBottom: 8 }}>Action items</div>
              {meeting.actionItems.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${a.done ? OK : LINE}`,
                                 background: a.done ? OK : "transparent", flexShrink: 0, marginTop: 2,
                                 display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {a.done && <span style={{ color: "#fff", fontSize: 9, fontWeight: 900 }}>✓</span>}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, color: a.done ? GRAY : INK,
                                   textDecoration: a.done ? "line-through" : "none" }}>{a.text}</span>
                    <span style={{ fontSize: 11, color: GRAY, marginLeft: 6 }}>→ {a.assignee}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ClientRiskCard({ project, tasks = [], tasksDone = new Set(), onToggleTask, onAddTask, onAction }) {
  const [emailThreads, setEmailThreads] = useState([]);
  const [meetings,     setMeetings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [addOpen,      setAddOpen]      = useState(false);
  const [taskLabel,    setTaskLabel]    = useState("");
  const [taskDue,      setTaskDue]      = useState("");

  const submitTask = (e) => {
    e.preventDefault();
    if (!taskLabel.trim()) return;
    onAddTask(project.name, project.client, taskLabel.trim(), taskDue || "No date");
    setTaskLabel(""); setTaskDue(""); setAddOpen(false);
  };

  const reco  = getRecommendations(project.client);
  const pc    = PRIORITY_COLOR[reco?.priority ?? "watch"];
  const daysNoContact = project.lastContact;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchOutlookThreads(project.client),
      fetchFirefliesNotes(project.client),
    ]).then(([threads, notes]) => {
      setEmailThreads(threads);
      setMeetings(notes);
      setLoading(false);
    });
  }, [project.client]);

  return (
    <div style={{ background: SURFACE, border: `2px solid ${pc.border}`, borderRadius: 20,
                  overflow: "hidden", marginBottom: 16,
                  boxShadow: "0 4px 24px rgba(40,39,36,.06)" }}>
      {/* header */}
      <div style={{ background: pc.bg, padding: "16px 22px",
                    borderBottom: `1.5px solid ${pc.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: pc.dot, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: INK, letterSpacing: -0.3 }}>{project.client}</div>
            <div style={{ fontSize: 12, color: GRAY2, marginTop: 1 }}>
              {project.name} · last contact {daysNoContact === 0 ? "today" : `${daysNoContact}d ago`}
              {daysNoContact > 7 && <span style={{ color: RISK, fontWeight: 700 }}> — silence risk ⚑</span>}
            </div>
          </div>
          <span style={{ fontSize: 11.5, background: pc.dot, color: "#fff", fontWeight: 700,
                         padding: "4px 12px", borderRadius: 12, fontFamily: mono }}>{pc.label}</span>
        </div>

        {/* summary */}
        {reco && (
          <div style={{ marginTop: 12, fontSize: 13.5, color: INK, lineHeight: 1.6,
                        background: "rgba(255,255,255,.6)", borderRadius: 12, padding: "10px 14px" }}>
            {reco.summary}
          </div>
        )}
      </div>

      <div style={{ padding: "18px 22px" }}>
        {loading ? (
          <div style={{ color: GRAY, fontSize: 13, padding: "20px 0", textAlign: "center" }}>
            Loading email + meeting data…
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* left: outlook */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
                            color: GRAY, fontFamily: mono, marginBottom: 12,
                            display: "flex", alignItems: "center", gap: 6 }}>
                <span>✉</span> Outlook · recent emails
              </div>
              {emailThreads.length === 0 ? (
                <div style={{ fontSize: 13, color: GRAY, padding: "12px 0" }}>No recent emails found.</div>
              ) : (
                emailThreads.map(t => <EmailThread key={t.id} thread={t} />)
              )}
            </div>

            {/* right: fireflies */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
                            color: GRAY, fontFamily: mono, marginBottom: 12,
                            display: "flex", alignItems: "center", gap: 6 }}>
                <span>🎙</span> Fireflies · meeting notes
              </div>
              {meetings.length === 0 ? (
                <div style={{ fontSize: 13, color: GRAY, padding: "12px 0" }}>No recent meetings found.</div>
              ) : (
                meetings.map(m => <MeetingCard key={m.id} meeting={m} />)
              )}
            </div>
          </div>
        )}

        {/* what to do */}
        {reco && (
          <div style={{ marginTop: 20, background: PANEL, borderRadius: 16, padding: "16px 18px",
                        border: `1.5px solid ${LINE}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
                          color: GRAY, fontFamily: mono, marginBottom: 12 }}>
              ✦ What to do
            </div>
            {reco.actions.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{a.icon}</span>
                <span style={{ fontSize: 13.5, color: INK, lineHeight: 1.55 }}>{a.text}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <button onClick={() => onAction(`Check-in email sent to ${project.client}`)} style={{
                padding: "8px 18px", borderRadius: 20, border: "none",
                background: INK, color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: ff,
              }}>Send check-in email</button>
              <button onClick={() => onAction(`Meeting booked with ${project.client}`)} style={{
                padding: "8px 18px", borderRadius: 20, border: `1.5px solid ${LINE}`,
                background: SURFACE, color: GRAY2, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: ff,
              }}>Book a call</button>
              <button onClick={() => onAction(`Status report generated for ${project.client}`)} style={{
                padding: "8px 18px", borderRadius: 20, border: `1.5px solid ${LINE}`,
                background: SURFACE, color: GRAY2, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: ff,
              }}>Generate report</button>
            </div>
          </div>
        )}

        {/* ── task panel ── */}
        <div style={{ marginTop: 20, borderTop: `1.5px solid ${LINE}`, paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
                           color: GRAY, fontFamily: mono }}>
              Tasks · {tasks.filter(t => !tasksDone.has(t.id)).length} open
            </span>
            <button onClick={() => setAddOpen(o => !o)} style={{
              padding: "4px 12px", borderRadius: 14,
              border: addOpen ? `1.5px solid ${INK}` : `1.5px solid ${LINE}`,
              background: addOpen ? INK : SURFACE,
              color: addOpen ? "#fff" : GRAY2,
              fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: ff,
            }}>
              {addOpen ? "✕ Cancel" : "+ Add task"}
            </button>
          </div>

          {addOpen && (
            <form onSubmit={submitTask} style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              <input
                autoFocus
                value={taskLabel}
                onChange={e => setTaskLabel(e.target.value)}
                placeholder="Task description…"
                style={{ flex: "1 1 180px", padding: "8px 12px", borderRadius: 12,
                         border: `1.5px solid ${LINE}`, fontSize: 13, fontFamily: ff,
                         color: INK, background: PANEL, outline: "none" }}
              />
              <input
                type="date"
                value={taskDue}
                onChange={e => setTaskDue(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: 12,
                         border: `1.5px solid ${LINE}`, fontSize: 12, fontFamily: mono,
                         color: GRAY2, background: PANEL, outline: "none", cursor: "pointer" }}
              />
              <button type="submit" style={{
                padding: "8px 16px", borderRadius: 12, border: "none",
                background: INK, color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: ff,
              }}>Add</button>
            </form>
          )}

          {tasks.length === 0 && !addOpen ? (
            <div style={{ fontSize: 12.5, color: GRAY, fontStyle: "italic" }}>No tasks yet.</div>
          ) : (
            tasks.map((t, i) => {
              const done = tasksDone.has(t.id);
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0",
                                         borderBottom: i < tasks.length - 1 ? `1px solid ${PANEL}` : "none" }}>
                  <button onClick={() => onToggleTask(t.id)} style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${done ? OK : LINE}`, background: done ? OK : "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {done && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
                  </button>
                  <span style={{ flex: 1, fontSize: 13, color: done ? GRAY : INK,
                                 textDecoration: done ? "line-through" : "none", opacity: done ? 0.6 : 1 }}>
                    {t.label}
                  </span>
                  {t.isNew && !done && (
                    <span style={{ fontSize: 9.5, background: OK_BG, color: OK, fontWeight: 700,
                                   padding: "1px 6px", borderRadius: 6, fontFamily: mono }}>New</span>
                  )}
                  <span style={{ fontSize: 11, fontFamily: mono, color: GRAY2, flexShrink: 0 }}>{t.due}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function AtRiskView({ projects, tasks = [], tasksDone, onToggleTask, onAddTask, mobile, addToast }) {
  // unhappy = red or yellow health, or last contact > 7 days
  const atRisk = projects
    .filter(p => p.client !== "Internal")
    .filter(p => p.health !== "green" || p.lastContact > 7)
    .sort((a, b) => {
      const order = { red: 0, yellow: 1, green: 2 };
      return order[a.health] - order[b.health] || b.lastContact - a.lastContact;
    });

  if (atRisk.length === 0) {
    return (
      <div style={{ background: OK_BG, border: `1.5px solid #A8D8C6`, borderRadius: 20,
                    padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: OK }}>All clients are happy — nothing at risk!</div>
        <div style={{ fontSize: 13, color: "#1E9E72", marginTop: 6 }}>Check back here if any project health changes.</div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: RISK }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                       color: GRAY, fontFamily: mono }}>
          {atRisk.length} client{atRisk.length > 1 ? "s" : ""} need attention
        </span>
      </div>

      {/* source badges */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, background: PANEL, color: GRAY2, padding: "4px 10px",
                       borderRadius: 20, fontFamily: mono, border: `1px solid ${LINE}` }}>
          ✉ Outlook — email threads
        </span>
        <span style={{ fontSize: 11, background: PANEL, color: GRAY2, padding: "4px 10px",
                       borderRadius: 20, fontFamily: mono, border: `1px solid ${LINE}` }}>
          🎙 Fireflies — meeting notes
        </span>
        <span style={{ fontSize: 11, background: WARN_BG, color: WARN, padding: "4px 10px",
                       borderRadius: 20, fontFamily: mono, border: `1px solid #A8D8C6`,
                       fontWeight: 600 }}>
          Mock data — connect APIs to go live
        </span>
      </div>

      {atRisk.map(p => (
        <ClientRiskCard
          key={p.id}
          project={p}
          tasks={tasks.filter(t => t.project === p.name)}
          tasksDone={tasksDone}
          onToggleTask={onToggleTask}
          onAddTask={onAddTask}
          onAction={addToast}
        />
      ))}
    </>
  );
}
