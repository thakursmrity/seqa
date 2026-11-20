"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWs } from "../../../lib/workspace";
import { Icon, Orb } from "../../../lib/ui";

const IDEAS = [
  ["search", "Find 5 companies that fit me and add the best to my pipeline"],
  ["doc", "Write briefs for my top 3 prospects"],
  ["mail", "Draft emails for companies that have a brief"],
  ["list", "What should I do today?"],
];
const LINK = { add: "/w/pipeline", brief: "/w/pipeline", draft: "/w/outreach", list: "/w/pipeline", search: "/w/prospects", score: "/w/prospects" };
const ICON = { add: "plus", brief: "doc", draft: "mail", list: "list", search: "search", score: "star" };

function Text({ t }) {
  return (
    <div className="rich">
      {t.split("\n").filter((l) => l.trim()).map((l, i) =>
        l.trim().startsWith("- ") ? <div key={i} className="li-row"><i />{l.trim().slice(2)}</div> : <p key={i}>{l}</p>
      )}
    </div>
  );
}

export default function Ask() {
  const { profile, api, load } = useWs();
  const [turns, setTurns] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  const started = useRef(false);

  async function send(msg) {
    const m = (msg ?? text).trim();
    if (!m || busy) return;
    const history = turns.map((t) => ({ role: t.role, content: t.text }));
    setTurns((t) => [...t, { role: "user", text: m }]);
    setText("");
    setBusy(true);
    try {
      const r = await api("/api/ask", { message: m, history });
      setTurns((t) => [...t, { role: "assistant", text: r.text || r.error || "Something went wrong.", actions: r.actions || [] }]);
      if (r.actions?.length) load();
    } catch {
      setTurns((t) => [...t, { role: "assistant", text: "Seqa could not reply. Please try again.", actions: [] }]);
    }
    setBusy(false);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) send(q);
  }, []); // eslint-disable-line
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [turns, busy]);

  return (
    <div className="ask">
      <div className="ask-body">
        {turns.length === 0 && (
          <div className="ask-hero">
            <Orb size={64} />
            <h1 className="grad">What should Seqa work on?</h1>
            <p className="sub">Tell me in plain words. I will search, score, research and draft. You approve everything, and I never send email.</p>
            <div className="ideas">
              {IDEAS.map(([ic, q]) => (
                <button key={q} className="idea" onClick={() => send(q)}><span className="idea-ic"><Icon name={ic} /></span>{q}</button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="bub me-b">{t.text}</div>
          ) : (
            <div key={i} className="ans">
              <Orb size={30} />
              <div className="ans-main">
                {t.actions?.length > 0 && (
                  <div className="timeline">
                    {t.actions.map((a, k) => (
                      <Link key={k} href={LINK[a.type] || "/w"} className="act"><span className="act-ic"><Icon name={ICON[a.type] || "spark"} size={15} /></span>{a.text}</Link>
                    ))}
                  </div>
                )}
                <Text t={t.text} />
              </div>
            </div>
          )
        )}
        {busy && (
          <div className="ans"><Orb size={30} /><div className="ans-main"><span className="typing"><i /><i /><i /></span><span className="small" style={{ marginLeft: 10 }}>Seqa is working, this can take up to a minute</span></div></div>
        )}
        <div ref={end} />
      </div>
      <div className="ask-bar">
        <textarea rows={1} value={text} placeholder={`Ask Seqa to work for ${profile?.sender_name || "you"}...`} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <button onClick={() => send()} disabled={busy || !text.trim()}><Icon name="send" size={18} /></button>
      </div>
    </div>
  );
}
