// ─────────────────────────────────────────────────────────────────────────
// ClickUp sync layer
//
// MODE "mcp-bridge" (current):
//   • PULL  — the app fetches /clickup-sync.json, a live snapshot kept current
//             from real ClickUp data via the ClickUp MCP connection. Refresh it
//             by asking Claude to "sync from ClickUp" (re-pulls + rewrites file).
//   • PUSH  — edits are applied optimistically in-app and queued to localStorage;
//             Claude applies the real ClickUp writes via MCP on request.
//
// MODE "live" (future, when a ClickUp API token is available):
//   • Point PULL/PUSH at a backend proxy (e.g. the Vite dev server) that holds
//     the token and calls the ClickUp REST API. Only these two functions change.
// ─────────────────────────────────────────────────────────────────────────

export const SYNC_MODE = "mcp-bridge";
const PUSH_QUEUE_KEY = "aotc_clickup_push_queue";

/** Pull the current ClickUp snapshot. Returns { source, syncedAt, updates, newTasks } or null. */
export async function pullRoadmap() {
  try {
    const res = await fetch(`/clickup-sync.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Push a task edit toward ClickUp. Optimistic in mcp-bridge mode; queued for real apply. */
export async function pushUpdate(clickupId, patch) {
  await new Promise((r) => setTimeout(r, 600)); // simulate network latency
  try {
    const q = JSON.parse(localStorage.getItem(PUSH_QUEUE_KEY) || "[]");
    q.push({ clickupId, patch, at: new Date().toISOString() });
    localStorage.setItem(PUSH_QUEUE_KEY, JSON.stringify(q));
  } catch {
    /* ignore storage errors */
  }
  return { ok: true, mode: SYNC_MODE };
}

/** Read the queued pushes (what Claude will apply to ClickUp via MCP). */
export function pendingPushes() {
  try {
    return JSON.parse(localStorage.getItem(PUSH_QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}
