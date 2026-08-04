/**
 * Integration adapters for Outlook and Fireflies.
 *
 * TODAY: returns mock data from src/data/integrations.js
 *
 * TO SWAP IN OUTLOOK:
 *   1. Set VITE_OUTLOOK_TOKEN in your .env.local
 *   2. Replace the body of fetchOutlookThreads() with the Graph API call below.
 *
 * TO SWAP IN FIREFLIES:
 *   1. Set VITE_FIREFLIES_KEY in your .env.local
 *   2. Replace the body of fetchFirefliesNotes() with the GraphQL call below.
 */

import { OUTLOOK_THREADS, FIREFLIES_NOTES, RECOMMENDATIONS } from "../data/integrations.js";

// ─── Outlook ──────────────────────────────────────────────────────────────────
/**
 * Returns recent email threads for a client name.
 *
 * REAL IMPLEMENTATION:
 *   const token = import.meta.env.VITE_OUTLOOK_TOKEN;
 *   const email = clientEmailMap[clientName]; // map client names → email domains
 *   const res = await fetch(
 *     `https://graph.microsoft.com/v1.0/me/messages` +
 *     `?$filter=from/emailAddress/address eq '${email}'` +
 *     `&$orderby=receivedDateTime desc&$top=5` +
 *     `&$select=id,subject,from,receivedDateTime,bodyPreview,isRead`,
 *     { headers: { Authorization: `Bearer ${token}` } }
 *   );
 *   const data = await res.json();
 *   return data.value.map(m => ({
 *     id: m.id,
 *     subject: m.subject,
 *     from: m.from.emailAddress.address,
 *     fromName: m.from.emailAddress.name,
 *     receivedAt: m.receivedDateTime,
 *     preview: m.bodyPreview,
 *     unread: !m.isRead,
 *     requiresReply: !m.isRead, // or use a custom flag
 *     sentiment: "unknown",     // plug in Azure Cognitive Services here
 *   }));
 */
export async function fetchOutlookThreads(clientName) {
  await Promise.resolve(); // keep async shape for future real fetch
  return OUTLOOK_THREADS[clientName] ?? [];
}

// ─── Fireflies ─────────────────────────────────────────────────────────────────
/**
 * Returns meeting transcripts + action items for a client name.
 *
 * REAL IMPLEMENTATION:
 *   const key = import.meta.env.VITE_FIREFLIES_KEY;
 *   const res = await fetch("https://api.fireflies.ai/graphql", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
 *     body: JSON.stringify({
 *       query: `{ transcripts(title: "${clientName}") {
 *         id title date duration
 *         participants { displayName }
 *         sentences { text rawText speaker_name }
 *         action_items { text assignee due_date }
 *       } }`
 *     }),
 *   });
 *   const { data } = await res.json();
 *   return data.transcripts;
 */
export async function fetchFirefliesNotes(clientName) {
  await Promise.resolve();
  return FIREFLIES_NOTES[clientName] ?? [];
}

// ─── Recommendations ───────────────────────────────────────────────────────────
/**
 * Returns curated recommendations for a client.
 * In production: replace with a Claude API call that summarises the
 * Outlook threads + Fireflies transcripts into a structured recommendation.
 */
export function getRecommendations(clientName) {
  return RECOMMENDATIONS[clientName] ?? null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function daysAgo(isoString) {
  const ms = Date.now() - new Date(isoString).getTime();
  const d  = Math.floor(ms / 86_400_000);
  return d === 0 ? "today" : d === 1 ? "yesterday" : `${d}d ago`;
}

export const SENTIMENT_LABEL = {
  frustrated: { label: "Frustrated",  color: "#C0392B", bg: "#FAE9E7" },
  concerned:  { label: "Concerned",   color: "#B98427", bg: "#F6EEDD" },
  neutral:    { label: "Neutral",     color: "#2A6B5A", bg: "#EDF8F3" },
  positive:   { label: "Positive",    color: "#1E9E72", bg: "#D4F0E6" },
  "at-risk":  { label: "At risk",     color: "#C0392B", bg: "#FAE9E7" },
  watch:      { label: "Watch",       color: "#B98427", bg: "#F6EEDD" },
  unknown:    { label: "Unknown",     color: "#5D9E8E", bg: "#EDF8F3" },
};
