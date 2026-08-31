import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, ff, mono } from "../brand/tokens.js";
import { askPepper } from "../lib/queries.js";

export default function AskPepper({ organizationId, onClose }) {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState(null); // { answer, sources }
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!question.trim() || asking) return;
    setAsking(true); setError(""); setResult(null);
    const { data, error: err } = await askPepper(question.trim(), organizationId);
    setAsking(false);
    if (err) { setError(err.message || "Could not get an answer — try again."); return; }
    setResult(data);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,87,74,.25)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "10vh 20px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 620, background: SURFACE, borderRadius: 20, boxShadow: "0 24px 64px rgba(20,87,74,.25)", overflow: "hidden" }}>
        <form onSubmit={submit} style={{ padding: "18px 20px", borderBottom: `1px solid ${LINE}`, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>🌶</span>
          <input
            autoFocus
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask Pepper about your projects, accounts, risks…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontFamily: ff, color: INK, background: "transparent" }}
          />
          <button type="submit" disabled={!question.trim() || asking} style={{
            fontSize: 12.5, fontWeight: 700, padding: "7px 16px", borderRadius: 10, border: "none",
            background: INK, color: "#fff", cursor: question.trim() ? "pointer" : "default",
            fontFamily: ff, opacity: question.trim() && !asking ? 1 : 0.5,
          }}>{asking ? "Thinking…" : "Ask"}</button>
        </form>

        <div style={{ padding: "18px 20px", minHeight: 80, maxHeight: "50vh", overflowY: "auto" }}>
          {!result && !error && !asking && (
            <div style={{ fontSize: 13, color: GRAY2 }}>Answers are grounded in this workspace's own projects, tasks, risks, and accounts — not general knowledge.</div>
          )}
          {asking && <div style={{ fontSize: 13, color: GRAY2 }}>Reading the workspace…</div>}
          {error && <div style={{ fontSize: 13, color: "#A23F3F" }}>{error}</div>}
          {result && (
            <>
              <div style={{ fontSize: 14.5, color: INK, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{result.answer}</div>
              {result.sources?.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${PANEL}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, fontFamily: mono, textTransform: "uppercase", marginBottom: 8 }}>Based on</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.sources.map((s, i) => (
                      <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 8, background: PANEL, color: GRAY2 }}>{s.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
