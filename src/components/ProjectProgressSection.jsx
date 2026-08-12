import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, WARN, RISK, mono } from "../brand/tokens.js";
import { useFeatures, useReleases, useTeamCapacity } from "../lib/queries.js";

function LoadBar({ load }) {
  const color = load > 120 ? RISK : load > 100 ? WARN : OK;
  return (
    <div style={{ flex: 1, background: PANEL, borderRadius: 6, height: 8, overflow: "hidden", minWidth: 60 }}>
      <div style={{ width: `${Math.min(load, 150) / 1.5}%`, height: "100%", background: color, borderRadius: 6 }} />
    </div>
  );
}

// Deliberately company-wide (not scoped to the viewer's own spaces) — this
// is the point of an executive progress view.
export default function ProjectProgressSection({ mobile }) {
  const FEATURES = useFeatures().data ?? [];
  const RELEASES = useReleases().data ?? [];
  const TEAM_CAPACITY = useTeamCapacity().data ?? [];

  const byProject = {};
  FEATURES.forEach((f) => {
    const key = f.project || "Unassigned";
    byProject[key] = byProject[key] || { total: 0, done: 0 };
    byProject[key].total += 1;
    if (f.status === "completed") byProject[key].done += 1;
  });
  const projectRows = Object.entries(byProject).map(([project, s]) => ({ project, pct: s.total ? Math.round((s.done / s.total) * 100) : 0, done: s.done, total: s.total }));

  const currentFocus = (name) => {
    const item = FEATURES.find((f) => (f.owner || "").includes(name) && f.status === "in_progress");
    return item?.name ?? null;
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
      <div style={{ background: SURFACE, border: `1.5px solid ${LINE}`, borderRadius: 18, padding: "18px 20px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: INK, marginBottom: 12 }}>📈 Project Progress</div>
        {projectRows.length === 0 && <div style={{ fontSize: 13, color: GRAY2 }}>No projects yet.</div>}
        {projectRows.map((p, i) => (
          <div key={p.project} style={{ padding: "8px 0", borderTop: i > 0 ? `1px solid ${PANEL}` : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>{p.project}</span>
              <span style={{ fontSize: 12, fontFamily: mono, color: p.pct === 100 ? OK : GRAY2 }}>{p.done}/{p.total} · {p.pct}%</span>
            </div>
            <div style={{ background: PANEL, borderRadius: 6, height: 7, overflow: "hidden" }}>
              <div style={{ width: `${p.pct}%`, height: "100%", background: p.pct === 100 ? OK : p.pct >= 50 ? WARN : RISK, borderRadius: 6 }} />
            </div>
          </div>
        ))}
        {RELEASES.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: mono, margin: "14px 0 6px" }}>Releases</div>
            {RELEASES.map((r) => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12.5 }}>
                <span style={{ color: INK }}>{r.version}</span>
                <span style={{ fontFamily: mono, fontWeight: 700, color: r.readiness >= 80 ? OK : r.readiness >= 50 ? WARN : RISK }}>{r.readiness}%</span>
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{ background: SURFACE, border: `1.5px solid ${LINE}`, borderRadius: 18, padding: "18px 20px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: INK, marginBottom: 12 }}>👥 Team Snapshot</div>
        {TEAM_CAPACITY.length === 0 && <div style={{ fontSize: 13, color: GRAY2 }}>No team data yet.</div>}
        {TEAM_CAPACITY.map((t, i) => {
          const focus = currentFocus(t.team.split(" ")[0]);
          return (
            <div key={t.team} style={{ padding: "8px 0", borderTop: i > 0 ? `1px solid ${PANEL}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: INK, minWidth: 110 }}>{t.team}</span>
                <LoadBar load={t.load} />
                <span style={{ fontSize: 12, fontWeight: 800, fontFamily: mono, color: t.load > 120 ? RISK : t.load > 100 ? WARN : OK }}>{t.load}%</span>
              </div>
              <div style={{ fontSize: 11, color: GRAY2, marginLeft: 2 }}>{focus ? `Working on: ${focus}` : "No active task"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
