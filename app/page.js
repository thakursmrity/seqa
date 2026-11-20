"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import config from "../data/seqa_config.json";

export default function Home() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function login(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (!error) setSent(true);
    else alert(error.message);
  }

  async function send(e) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const next = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    const res = await fetch("/api/seqa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages: next }),
    });
    const data = await res.json();
    setMessages([...next, { role: "assistant", content: data.text || data.error }]);
    setBusy(false);
  }

  if (!ready) return null;

  return (
    <div className="wrap">
      <span className="badge">Being built in public</span>
      <h1>Seqa</h1>
      <p className="sub">A Sequor AI project</p>

      {!session ? (
        <div className="card">
          {sent ? (
            <p>Check your email for a login link, then come back to this tab.</p>
          ) : (
            <form onSubmit={login}>
              <p>Enter your email and I will send you a login link.</p>
              <input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit">Send link</button>
            </form>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="msg seqa">{config.agent.greeting}</div>
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === "user" ? "me" : "seqa"}`}>{m.content}</div>
          ))}
          {busy && <div className="small">Seqa is thinking...</div>}
          <form onSubmit={send} className="row" style={{ marginTop: 12 }}>
            <input placeholder="Tell Seqa what you sell" value={input} onChange={(e) => setInput(e.target.value)} />
            <button type="submit" disabled={busy}>Send</button>
          </form>
          <p className="small">
            <a href="#" onClick={(e) => { e.preventDefault(); supabase.auth.signOut(); setMessages([]); }}>Log out</a>
          </p>
        </div>
      )}
    </div>
  );
}
