"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import config from "../data/seqa_config.json";

export default function Home() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signup");
  const [note, setNote] = useState("");
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
    setNote("");
    const fn = mode === "signup" ? supabase.auth.signUp : supabase.auth.signInWithPassword;
    const { data, error } = await fn.call(supabase.auth, { email, password });
    if (error) return setNote(error.message);
    if (mode === "signup" && !data.session) {
      setNote("Account created. If email confirmation is on in Supabase, switch it off, then log in.");
      setMode("login");
    }
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setNote(error.message);
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
          <button type="button" onClick={google} style={{ width: "100%", marginTop: 0, marginBottom: 12 }}>Continue with Google</button>
          <p className="small" style={{ textAlign: "center" }}>or use email and password</p>
          <form onSubmit={login}>
            <p>{mode === "signup" ? "Create your account to start." : "Welcome back. Log in to continue."}</p>
            <input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" required minLength={6} placeholder="Password (6+ characters)" style={{ marginTop: 8 }} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit">{mode === "signup" ? "Sign up" : "Log in"}</button>
            {note && <p className="small">{note}</p>}
            <p className="small">
              <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "signup" ? "login" : "signup"); setNote(""); }}>
                {mode === "signup" ? "I already have an account" : "Create a new account"}
              </a>
            </p>
          </form>
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
