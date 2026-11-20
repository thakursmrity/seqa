"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useWs, companyById, companyOf, STATUSES } from "../lib/workspace";

export default function ProspectDrawer({ companyId, onClose }) {
  const { profile, session, prospects, drafts, api, addProspects, updateProspect, removeProspect, addDraft } = useWs();
  const p = prospects.find((x) => x.company_id === companyId);
  const c = companyById[companyId] || companyOf(p);
  const web = companyId.startsWith("web:");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [people, setPeople] = useState(null);
  const [titles, setTitles] = useState("");
  const [looking, setLooking] = useState("");
  const [contact, setContact] = useState({ name: "", role: "", email: "", notes: "" });

  useEffect(() => {
    setErr("");
    setContact({ name: p?.contact_name || "", role: p?.contact_role || "", email: p?.contact_email || "", notes: p?.notes || "" });
  }, [companyId, p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!c) return null;
  const myDrafts = p ? drafts.filter((d) => d.prospect_id === p.id) : [];

  async function add() {
    setBusy("add");
    const r = await api("/api/score", { typeLabel: profile.type_label, sells: profile.sells, ids: [c.id] });
    const s = r.scores?.[0];
    await addProspects([{ company_id: c.id, fit: s?.score, reason: s?.reason }]);
    setBusy("");
  }

  async function brief() {
    setBusy("brief");
    setErr("");
    const r = await api("/api/brief", { typeLabel: profile.type_label, sells: profile.sells, companyId: c.id, company: web ? c : undefined });
    if (r.error) setErr(r.error);
    else await updateProspect(p.id, { brief: r.brief, status: p.status === "new" ? "researched" : p.status });
    setBusy("");
  }

  async function write() {
    setBusy("draft");
    setErr("");
    const r = await api("/api/draft", {
      typeLabel: profile.type_label, sells: profile.sells, companyId: c.id, company: web ? c : undefined,
      contactName: contact.name, senderName: profile.sender_name || session.user.email.split("@")[0], angle: p.brief?.angle,
    });
    if (r.error) setErr(r.error);
    else await addDraft(p.id, r.subject, r.body);
    setBusy("");
  }

  async function findPeopleNow() {
    setBusy("people"); setErr(""); setPeople(null);
    const t = (titles || (p?.brief?.buyers || []).join(", ") || "Founder, Director, Head, Manager").split(",").map((x) => x.trim()).filter(Boolean);
    const r = await api("/api/contacts", { companyId: c.id, name: c.company, website: c.website, titles: t });
    if (r.error) setErr(r.error); else setPeople(r.people || []);
    setBusy("");
  }

  async function getEmail(person) {
    setLooking(person.profile_url); setErr("");
    const r = await api("/api/contacts", { action: "email", profileUrl: person.profile_url });
    setLooking("");
    if (r.error) return setErr(r.error);
    if (!r.email) return setErr(`No email found for ${person.name}.`);
    const next = { ...contact, name: person.name, role: person.title, email: r.email };
    setContact(next);
    await updateProspect(p.id, { contact_name: next.name, contact_role: next.role, contact_email: next.email });
  }

  const saveContact = () =>
    updateProspect(p.id, { contact_name: contact.name, contact_role: contact.role, contact_email: contact.email, notes: contact.notes });

  return (
    <>
      <div className="drawer-back" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-head">
          <div>
            <h2 style={{ margin: 0 }}>{c.company}</h2>
            <div className="tags"><span>{c.category}</span><span>{c.stage}</span>{c.funding_size !== "Not applicable" && <span>{c.funding_size}</span>}</div>
          </div>
          <button className="ghost small-btn" onClick={onClose}>Close</button>
        </div>

        <p className="what" style={{ fontSize: 15 }}>{c.what_they_do}</p>
        <p className="small"><b>Signal:</b> {c.why_they_matter} <a href={c.source_url} target="_blank" rel="noopener noreferrer">Source</a></p>

        {!p ? (
          <button disabled={busy === "add"} onClick={add}>{busy === "add" ? "Scoring fit..." : "Add to pipeline"}</button>
        ) : (
          <>
            <div className="row2">
              <span className="score">Fit {p.fit ? `${p.fit}/10` : "not scored"}</span>
              <select value={p.status} onChange={(e) => updateProspect(p.id, { status: e.target.value })}>
                {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {p.reason && <p className="why">{p.reason}</p>}

            <h3 className="dh">Researcher brief</h3>
            {p.brief ? (
              <div className="brief">
                <p>{p.brief.summary}</p>
                <b className="small">Why they may need you</b>
                <ul>{(p.brief.needs || []).map((n, i) => <li key={i}>{n}</li>)}</ul>
                <b className="small">Likely decision makers</b>
                <p>{(p.brief.buyers || []).join(", ")}</p>
                <b className="small">Opening angle</b>
                <p>{p.brief.angle}</p>
                <button className="ghost small-btn" disabled={busy === "brief"} onClick={brief}>{busy === "brief" ? "Writing..." : "Redo brief"}</button>
              </div>
            ) : (
              <button disabled={busy === "brief"} onClick={brief}>{busy === "brief" ? "Researching..." : "Write brief"}</button>
            )}

            <h3 className="dh">Contact</h3>
            <div className="finder-people">
              <input placeholder={`Job titles to look for, e.g. ${(p?.brief?.buyers || ["Principal", "Director"]).slice(0, 2).join(", ")}`} value={titles} onChange={(e) => setTitles(e.target.value)} />
              <button className="ghost small-btn" disabled={busy === "people"} onClick={findPeopleNow}>{busy === "people" ? "Looking..." : "Find contacts"}</button>
            </div>
            {c.public_contact?.email && (
              <p className="small">Email Seqa saw on their site (check it first): <b>{c.public_contact.email}</b> <a href="#" onClick={(e) => { e.preventDefault(); const next = { ...contact, email: c.public_contact.email }; setContact(next); updateProspect(p.id, { contact_email: next.email }); }}>Use it</a></p>
            )}
            {people && people.length === 0 && <p className="small">No people found. Try other titles.</p>}
            {people && people.map((x) => (
              <div key={x.profile_url} className="person">
                <div><b>{x.name}</b><div className="small">{x.title}</div></div>
                <div className="person-act">
                  <a className="small" href={x.profile_url} target="_blank" rel="noopener noreferrer">Profile</a>
                  <button className="ghost small-btn" disabled={looking === x.profile_url} onClick={() => getEmail(x)}>{looking === x.profile_url ? "..." : "Get email"}</button>
                </div>
              </div>
            ))}
            {people && people.length > 0 && <p className="small">Each email lookup uses Crustdata credits. Emails come from Crustdata and are not checked by Seqa.</p>}
            <input placeholder="Contact name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} onBlur={saveContact} />
            <input placeholder="Role" value={contact.role} onChange={(e) => setContact({ ...contact, role: e.target.value })} onBlur={saveContact} style={{ marginTop: 8 }} />
            <input placeholder="Email" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} onBlur={saveContact} style={{ marginTop: 8 }} />

            <h3 className="dh">Email</h3>
            <button disabled={busy === "draft"} onClick={write}>{busy === "draft" ? "Writing..." : myDrafts.length ? "Write another draft" : "Draft email"}</button>
            {myDrafts.length > 0 && <p className="small">{myDrafts.length} draft{myDrafts.length > 1 ? "s" : ""} saved. <Link href="/w/outreach">Open Outreach</Link></p>}

            <h3 className="dh">Notes</h3>
            <textarea rows={3} value={contact.notes} onChange={(e) => setContact({ ...contact, notes: e.target.value })} onBlur={saveContact} style={{ width: "100%" }} />
            <p className="small"><a href="#" onClick={(e) => { e.preventDefault(); removeProspect(p.id); onClose(); }}>Remove from pipeline</a></p>
          </>
        )}
        {err && <p className="small" style={{ color: "var(--danger)" }}>{err}</p>}
      </aside>
    </>
  );
}
