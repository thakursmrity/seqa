"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useWs, companyById } from "../../../lib/workspace";

export default function Outreach() {
  const { prospects, drafts, updateDraft, removeDraft, updateProspect } = useWs();
  const [sel, setSel] = useState(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  const current = drafts.find((d) => d.id === sel) || null;
  const prospectOf = (d) => prospects.find((p) => p.id === d.prospect_id);
  const nameOf = (d) => companyById[prospectOf(d)?.company_id]?.company || "Company";

  useEffect(() => {
    if (!sel && drafts.length) setSel(drafts[0].id);
  }, [drafts, sel]);

  useEffect(() => {
    if (current) { setSubject(current.subject || ""); setBody(current.body || ""); setCopied(false); }
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => current && updateDraft(current.id, { subject, body });
  const to = current ? prospectOf(current)?.contact_email || "" : "";
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  async function copy() {
    try { await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`); setCopied(true); } catch {}
  }
  function markSent() {
    updateDraft(current.id, { subject, body, status: "sent" });
    const p = prospectOf(current);
    if (p && (p.status === "new" || p.status === "researched")) updateProspect(p.id, { status: "contacted" });
  }

  return (
    <>
      <div className="pagehead"><div><h1>Outreach</h1><p className="sub">Review each email. Nothing is sent until you send it yourself.</p></div></div>
      {drafts.length === 0 ? (
        <div className="card"><p>No drafts yet. Open a company in <Link href="/w/pipeline">Pipeline</Link> and press Draft email.</p></div>
      ) : (
        <div className="split2">
          <div className="card list">
            {drafts.map((d) => (
              <button key={d.id} className={`li ${sel === d.id ? "on" : ""}`} onClick={() => setSel(d.id)}>
                <b>{nameOf(d)}</b>
                <span className="small">{d.status === "sent" ? "Sent" : "Draft ready"}</span>
              </button>
            ))}
          </div>
          {current && (
            <div className="card">
              <div className="small">To: {to || "Add the contact email in Pipeline"}</div>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} onBlur={save} style={{ fontWeight: 600, margin: "8px 0" }} />
              <textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} onBlur={save} style={{ width: "100%", lineHeight: 1.6 }} />
              <div className="btnrow">
                <a className="btn" href={gmail} target="_blank" rel="noopener noreferrer" onClick={save}>Open in Gmail</a>
                <button className="ghost" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
                {current.status !== "sent" && <button className="ghost" onClick={markSent}>Mark as sent</button>}
                <button className="ghost" onClick={() => { removeDraft(current.id); setSel(null); }}>Delete</button>
              </div>
              <p className="small">Written by the Writer agent from the company brief. Gmail opens a new message for you to review and send.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
