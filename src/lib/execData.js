// ─────────────────────────────────────────────────────────────────────────
// Executive modules — invoices, pipeline (opportunities), meetings, notes.
// Nothing like this exists in ClickUp or any connected tool yet, so this is
// manual-entry, local-storage-first (same pattern as gamification.js /
// localDirectory.js) — but field names follow real-tool conventions
// (QuickBooks/Zoho Books for invoices, HubSpot for pipeline/deals) so a
// later integration is a drop-in rather than a rebuild. Forward-compatible
// tables already exist in supabase/migrations/0001_init.sql.
// ─────────────────────────────────────────────────────────────────────────

const KEYS = {
  invoices: "aotc_invoices",
  opportunities: "aotc_opportunities",
  meetings: "aotc_meetings",
  notes: "aotc_notes",
};

function loadJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
const makeId = () => `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function makeCollection(key) {
  return {
    getAll: () => loadJSON(key, []),
    add: (row) => {
      const list = loadJSON(key, []);
      const withId = { id: makeId(), createdAt: new Date().toISOString(), ...row };
      saveJSON(key, [...list, withId]);
      return withId;
    },
    update: (id, patch) => {
      saveJSON(key, loadJSON(key, []).map((r) => (r.id === id ? { ...r, ...patch } : r)));
    },
    remove: (id) => {
      saveJSON(key, loadJSON(key, []).filter((r) => r.id !== id));
    },
  };
}

// ─── INVOICES (QuickBooks/Zoho Books-style) ────────────────────────────────
// status: draft | sent | paid | overdue | void
const invoicesStore = makeCollection(KEYS.invoices);
export const getInvoices = invoicesStore.getAll;
export const addInvoice = (row) => invoicesStore.add({ currency: "INR", status: "sent", ...row });
export const updateInvoice = invoicesStore.update;
export const deleteInvoice = invoicesStore.remove;

// ─── PIPELINE / OPPORTUNITIES (HubSpot deal-style) ─────────────────────────
// type: new_client | upsell   stage: lead | contacted | proposal | negotiation | won | lost
const opportunitiesStore = makeCollection(KEYS.opportunities);
export const getOpportunities = opportunitiesStore.getAll;
export const addOpportunity = (row) => opportunitiesStore.add({ type: "new_client", stage: "lead", ...row });
export const updateOpportunity = opportunitiesStore.update;
export const deleteOpportunity = opportunitiesStore.remove;

// ─── MEETINGS (covers both "meeting notes" and "meeting reminders" — an ──
// upcoming meeting is just a row with no notes yet)
const meetingsStore = makeCollection(KEYS.meetings);
export const getMeetings = meetingsStore.getAll;
export const addMeeting = (row) => meetingsStore.add({ attendees: [], actionItems: [], notes: "", ...row });
export const updateMeeting = meetingsStore.update;
export const deleteMeeting = meetingsStore.remove;

// ─── NOTES (product notes, product plans, project plans — one freeform type) ─
// category: product | plan | general
const notesStore = makeCollection(KEYS.notes);
export const getNotes = notesStore.getAll;
export const addNote = (row) => notesStore.add({ category: "general", ...row });
export const updateNote = notesStore.update;
export const deleteNote = notesStore.remove;

// ─── Shared helpers ─────────────────────────────────────────────────────────

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "void"];
export const OPPORTUNITY_STAGES = ["lead", "contacted", "proposal", "negotiation", "won", "lost"];
export const NOTE_CATEGORIES = ["product", "plan", "general"];

export function invoiceSummary(invoices) {
  const sent = invoices.filter((i) => i.status !== "draft" && i.status !== "void");
  const onTime = sent.filter((i) => i.status === "paid" ? new Date(i.paidDate) <= new Date(i.dueDate) : new Date() <= new Date(i.dueDate));
  const received = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount || 0), 0);
  const overdue = invoices.filter((i) => i.status === "overdue" || (i.status === "sent" && i.dueDate && new Date(i.dueDate) < new Date()))
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const onTimePct = sent.length ? Math.round((onTime.length / sent.length) * 100) : 100;
  return { onTimePct, received, overdue, sentCount: sent.length };
}
