import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, OK_BG, ff, mono } from "../brand/tokens.js";
import { SUPABASE_CONFIGURED } from "../lib/supabaseClient.js";
import { useAccounts, createAccount, useContacts, createContact, useOpportunities, useProjects } from "../lib/queries.js";

const inp = {
  width: "100%", boxSizing: "border-box", padding: "8px 11px", borderRadius: 9,
  border: `1.5px solid ${LINE}`, fontSize: 13, fontFamily: ff, color: INK,
  background: SURFACE, outline: "none",
};

export default function AccountsView({ addToast, mobile }) {
  const { data: accountsData, refetch: refetchAccounts } = useAccounts();
  const accounts = accountsData ?? [];
  const { data: allOpps } = useOpportunities();
  const { data: allProjects } = useProjects();

  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");

  const submitAccount = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await createAccount({ name: name.trim(), domain: domain.trim() || null });
    if (error) { addToast("Could not create account — try again"); return; }
    await refetchAccounts();
    addToast(`Account "${name.trim()}" created`);
    setName(""); setDomain(""); setShowAdd(false);
  };

  const activeAccount = accounts.find((a) => a.id === selected);

  return (
    <div>
      {!SUPABASE_CONFIGURED && (
        <div style={{ fontSize: 11.5, color: GRAY2, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 10, padding: "8px 12px", marginBottom: 16 }}>
          Running in local/demo mode — accounts and contacts are saved in this browser until Supabase is connected.
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>🏢 Accounts</div>
          <div style={{ fontSize: 12, color: GRAY2, marginTop: 2 }}>{accounts.length} customer{accounts.length !== 1 ? "s" : ""}</div>
        </div>
        <button onClick={() => setShowAdd((s) => !s)} style={{
          marginLeft: "auto", fontSize: 13, fontWeight: 700, padding: "8px 18px", borderRadius: 12,
          border: "none", background: showAdd ? PANEL : INK, color: showAdd ? GRAY2 : "#fff",
          cursor: "pointer", fontFamily: ff,
        }}>{showAdd ? "✕ Cancel" : "+ Add account"}</button>
      </div>

      {showAdd && (
        <form onSubmit={submitAccount} style={{ background: SURFACE, border: `1.5px solid ${INK}33`, borderRadius: 16, padding: 18, marginBottom: 18, display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 10, color: GRAY, fontFamily: mono, marginBottom: 4 }}>ACCOUNT NAME *</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Inc" style={inp} autoFocus />
          </div>
          <div>
            <div style={{ fontSize: 10, color: GRAY, fontFamily: mono, marginBottom: 4 }}>DOMAIN</div>
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acme.com" style={inp} />
          </div>
          <button type="submit" disabled={!name.trim()} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: INK, color: "#fff", fontSize: 13, fontWeight: 700, cursor: name.trim() ? "pointer" : "default", fontFamily: ff, opacity: name.trim() ? 1 : 0.5 }}>Create</button>
        </form>
      )}

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "300px 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {accounts.map((a) => {
            const oppCount = (allOpps ?? []).filter((o) => o.accountId === a.id).length;
            const projCount = (allProjects ?? []).filter((p) => p.accountId === a.id).length;
            const isSel = a.id === selected;
            return (
              <button key={a.id} onClick={() => setSelected(a.id)} style={{
                textAlign: "left", padding: "12px 14px", borderRadius: 12,
                border: `1.5px solid ${isSel ? INK : LINE}`, background: isSel ? PANEL : SURFACE,
                cursor: "pointer", fontFamily: ff,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{a.name}</div>
                <div style={{ fontSize: 11, color: GRAY2, marginTop: 3 }}>{projCount} project{projCount !== 1 ? "s" : ""} · {oppCount} opportunit{oppCount !== 1 ? "ies" : "y"}</div>
              </button>
            );
          })}
          {accounts.length === 0 && <div style={{ fontSize: 12.5, color: GRAY2, padding: "12px 4px" }}>No accounts yet.</div>}
        </div>

        <div>
          {activeAccount
            ? <AccountDetail account={activeAccount} opportunities={(allOpps ?? []).filter((o) => o.accountId === activeAccount.id)} projects={(allProjects ?? []).filter((p) => p.accountId === activeAccount.id)} addToast={addToast} />
            : <div style={{ fontSize: 13, color: GRAY2, padding: "24px 4px" }}>Select an account to see contacts, opportunities, and projects.</div>}
        </div>
      </div>
    </div>
  );
}

function AccountDetail({ account, opportunities, projects, addToast }) {
  const { data: contactsData, refetch: refetchContacts } = useContacts(account.id);
  const contacts = contactsData ?? [];
  const [showAddContact, setShowAddContact] = useState(false);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cTitle, setCTitle] = useState("");
  const [cRole, setCRole] = useState("");

  const submitContact = async (e) => {
    e.preventDefault();
    if (!cName.trim()) return;
    const { error } = await createContact({ accountId: account.id, name: cName.trim(), email: cEmail.trim() || null, title: cTitle.trim() || null, roleLabel: cRole || null });
    if (error) { addToast("Could not add contact — try again"); return; }
    await refetchContacts();
    addToast(`${cName.trim()} added to ${account.name}`);
    setCName(""); setCEmail(""); setCTitle(""); setCRole(""); setShowAddContact(false);
  };

  return (
    <div style={{ background: SURFACE, border: `1.5px solid ${LINE}`, borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: INK }}>{account.name}</div>
      {account.domain && <div style={{ fontSize: 12, color: GRAY2, fontFamily: mono, marginTop: 2 }}>{account.domain}</div>}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, fontFamily: mono, textTransform: "uppercase" }}>Contacts</div>
        <button onClick={() => setShowAddContact((s) => !s)} style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 12px", borderRadius: 8, border: `1.5px solid ${LINE}`, background: SURFACE, color: GRAY2, cursor: "pointer", fontFamily: ff }}>{showAddContact ? "✕ Cancel" : "+ Add contact"}</button>
      </div>
      {showAddContact && (
        <form onSubmit={submitContact} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12, background: PANEL, borderRadius: 12, padding: 12 }}>
          <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Name *" style={inp} autoFocus />
          <input value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="Email" style={inp} />
          <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="Title" style={inp} />
          <input value={cRole} onChange={(e) => setCRole(e.target.value)} placeholder="e.g. Decision Maker" style={inp} />
          <button type="submit" disabled={!cName.trim()} style={{ gridColumn: "1 / -1", padding: "8px 0", borderRadius: 9, border: "none", background: INK, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: ff }}>Add contact</button>
        </form>
      )}
      {contacts.length === 0
        ? <div style={{ fontSize: 12.5, color: GRAY2, marginBottom: 16 }}>No contacts yet.</div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {contacts.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: PANEL, borderRadius: 9 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{c.name}</span>
                  {c.title && <span style={{ fontSize: 11.5, color: GRAY2, marginLeft: 6 }}>· {c.title}</span>}
                </div>
                {c.roleLabel && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: OK_BG, color: OK }}>{c.roleLabel}</span>}
                {c.email && <span style={{ fontSize: 11, color: GRAY2, fontFamily: mono }}>{c.email}</span>}
              </div>
            ))}
          </div>}

      <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, fontFamily: mono, textTransform: "uppercase", marginBottom: 10 }}>Opportunities</div>
      {opportunities.length === 0
        ? <div style={{ fontSize: 12.5, color: GRAY2, marginBottom: 16 }}>None yet.</div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {opportunities.map((o) => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: PANEL, borderRadius: 9, fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: INK }}>{o.name}</span>
                <span style={{ color: GRAY2, fontFamily: mono, fontSize: 11 }}>{o.stage}{o.amount ? ` · ₹${o.amount}` : ""}</span>
              </div>
            ))}
          </div>}

      <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, fontFamily: mono, textTransform: "uppercase", marginBottom: 10 }}>Delivery projects</div>
      {projects.length === 0
        ? <div style={{ fontSize: 12.5, color: GRAY2 }}>No active project — this account has no delivery work right now.</div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {projects.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: PANEL, borderRadius: 9, fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: INK }}>{p.name}</span>
                <span style={{ color: GRAY2, fontFamily: mono, fontSize: 11 }}>{p.progress}% · {p.health}</span>
              </div>
            ))}
          </div>}
    </div>
  );
}
