"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import config from "../data/seqa_config.json";

const catLabel = (id) => config.buyer_categories.find((c) => c.id === id)?.label || id;

export default function Home() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signup");
  const [note, setNote] = useState("");

  // Guided flow state
  const [step, setStep] = useState("type"); // type, sells, buyers, filters, results
  const [feed, setFeed] = useState([{ from: "seqa", text: config.agent.greeting }]);
  const [type, setType] = useState(null);
  const [sells, setSells] = useState("");
  const [input, setInput] = useState("");
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [buyerIds, setBuyerIds] = useState([]);
  const [stages, setStages] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [results, setResults] = useState([]);
  const [compare, setCompare] = useState([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feed, step, busy, results, compare]);

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

  const say = (text) => setFeed((f) => [...f, { from: "seqa", text }]);
  const me = (text) => setFeed((f) => [...f, { from: "me", text }]);

  async function api(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  function restart() {
    setStep("type");
    setFeed([{ from: "seqa", text: config.agent.greeting }]);
    setType(null); setSells(""); setInput("");
    setBuyerOptions([]); setBuyerIds([]); setStages([]); setSizes([]);
    setResults([]); setCompare([]);
  }

  // Step 1: company type
  function chooseType(t) {
    setType(t);
    me(t.label);
    say("Got it. In one line, what does your product do?");
    setStep("sells");
  }

  // Step 2: one line about the product
  async function submitSells(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setSells(text);
    me(text);
    setBusy(true);
    const c = await api("/api/seqa", { kind: "comment", typeLabel: type.label, sells: text });
    say(c.text || c.error);

    let ids = type.buyer_category_ids;
    if (type.id === "other") {
      const r = await api("/api/seqa", { kind: "classify", sells: text });
      ids = r.ids?.length ? r.ids : config.buyer_categories.map((x) => x.id);
    }
    setBuyerOptions(ids);
    say(type.seqa_says || "Here are the groups that may fit best. Pick one or more.");
    setBusy(false);
    setStep("buyers");
  }

  // Step 3: buyer categories
  const toggle = (list, setList, v) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function confirmBuyers() {
    me(buyerIds.map(catLabel).join(", "));
    say("Want to narrow it down? Both filters are optional. Leave them empty for any.");
    setStep("filters");
  }

  // Step 4 and 5: filters, then shortlist
  async function findCompanies() {
    me(`Stage: ${stages.length ? stages.join(", ") : "any"}. Funding: ${sizes.length ? sizes.join(", ") : "any"}.`);
    setBusy(true);
    const r = await api("/api/shortlist", {
      typeLabel: type.label, sells, categoryIds: buyerIds, stages, sizes,
    });
    setBusy(false);
    if (r.error) { say(r.error); return; }
    setResults(r.results || []);
    setCompare([]);
    if (!r.results?.length) {
      say("No companies match those filters. Try fewer filters.");
      setStep("filters");
      return;
    }
    say(`Here are your top ${r.results.length} matches, best fit first. Tick up to 3 to compare them.`);
    setStep("results");
  }

  const toggleCompare = (id) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 3 ? [...c, id] : c));

  if (!ready) return null;

  if (!session) {
    return (
      <div className="wrap">
        <span className="badge">Being built in public</span>
        <h1>Seqa</h1>
        <p className="sub">A Sequor AI project</p>
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
      </div>
    );
  }

  const picked = results.filter((r) => compare.includes(r.id));

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">S</span>
          <strong>Seqa</strong>
          <span className="badge">Being built in public</span>
        </div>
        <div className="top-actions">
          {step !== "type" && <a href="#" className="small" onClick={(e) => { e.preventDefault(); restart(); }}>Start over</a>}
          <a href="#" className="small" onClick={(e) => { e.preventDefault(); supabase.auth.signOut(); restart(); }}>Log out</a>
        </div>
      </header>

      <main className="chat">
        <div className="chat-inner">
          {feed.map((m, i) => (
            <div key={i} className={`row-msg ${m.from === "me" ? "mine" : ""}`}>
              {m.from === "seqa" && <span className="avatar">S</span>}
              <div className={`msg ${m.from === "me" ? "me" : "seqa"}`}>{m.text}</div>
            </div>
          ))}

          {busy && (
            <div className="row-msg">
              <span className="avatar">S</span>
              <div className="msg seqa typing"><i /><i /><i /></div>
            </div>
          )}

          {step === "type" && (
            <section className="options">
              <div className="grid">
                {config.company_types.map((t) => (
                  <button key={t.id} className="option" onClick={() => chooseType(t)}>
                    <strong>{t.label}</strong>
                    <span>{t.note}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === "buyers" && !busy && (
            <section className="options">
              <div className="grid">
                {buyerOptions.map((id) => {
                  const c = config.buyer_categories.find((x) => x.id === id);
                  return (
                    <button key={id} className={`option ${buyerIds.includes(id) ? "on" : ""}`} onClick={() => toggle(buyerIds, setBuyerIds, id)}>
                      <strong>{c.label}</strong>
                      <span>{c.note}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {step === "filters" && !busy && (
            <section className="options">
              <p className="options-title">Funding stage</p>
              <div className="chips">
                {config.filters.stage.map((s) => (
                  <button key={s} className={`chip ${stages.includes(s) ? "on" : ""}`} onClick={() => toggle(stages, setStages, s)}>{s}</button>
                ))}
              </div>
              <p className="options-title">Funding size</p>
              <div className="chips">
                {config.filters.funding_size.filter((s) => s !== "Not applicable").map((s) => (
                  <button key={s} className={`chip ${sizes.includes(s) ? "on" : ""}`} onClick={() => toggle(sizes, setSizes, s)}>{s}</button>
                ))}
              </div>
            </section>
          )}

          {step === "results" && (
            <section className="results">
              {results.map((r) => (
                <article key={r.id} className={`company ${compare.includes(r.id) ? "on" : ""}`}>
                  <div className="company-top">
                    <strong>{r.company}</strong>
                    <span className="score">Fit {r.score}/10</span>
                  </div>
                  <div className="tags">
                    <span>{r.category}</span>
                    <span>{r.stage}</span>
                    {r.funding_size !== "Not applicable" && <span>{r.funding_size}</span>}
                  </div>
                  <p className="why">{r.reason}</p>
                  <p className="what">{r.what_they_do}</p>
                  <div className="company-bottom">
                    <label className="small">
                      <input type="checkbox" checked={compare.includes(r.id)} onChange={() => toggleCompare(r.id)} /> Compare
                    </label>
                    <a className="small" href={r.source_url} target="_blank" rel="noopener noreferrer">Source</a>
                  </div>
                </article>
              ))}

              {picked.length >= 2 && (
                <div className="compare">
                  <table>
                    <thead>
                      <tr><th></th>{picked.map((p) => <th key={p.id}>{p.company}</th>)}</tr>
                    </thead>
                    <tbody>
                      <tr><td>Fit</td>{picked.map((p) => <td key={p.id}>{p.score}/10</td>)}</tr>
                      <tr><td>Category</td>{picked.map((p) => <td key={p.id}>{p.category}</td>)}</tr>
                      <tr><td>Stage</td>{picked.map((p) => <td key={p.id}>{p.stage}</td>)}</tr>
                      <tr><td>Funding</td>{picked.map((p) => <td key={p.id}>{p.funding_size}</td>)}</tr>
                      <tr><td>Why them</td>{picked.map((p) => <td key={p.id}>{p.reason}</td>)}</tr>
                      <tr><td>Signal</td>{picked.map((p) => <td key={p.id}>{p.why_they_matter}</td>)}</tr>
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
          <div ref={endRef} />
        </div>
      </main>

      <footer className="composer">
        <div className="composer-inner">
          {step === "type" && <p className="small hint">Pick the card that fits your company best.</p>}
          {step === "sells" && (
            <form onSubmit={submitSells} className="composer-inner" style={{ padding: 0, width: "100%" }}>
              <textarea
                rows={1}
                autoFocus
                placeholder="For example: B2B invoicing and payouts"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitSells(e); } }}
              />
              <button type="submit" disabled={busy || !input.trim()}>Next</button>
            </form>
          )}
          {step === "buyers" && (
            <>
              <p className="small hint">{buyerIds.length ? `${buyerIds.length} selected` : "Pick one or more groups."}</p>
              <button onClick={confirmBuyers} disabled={busy || buyerIds.length === 0}>Next</button>
            </>
          )}
          {step === "filters" && (
            <>
              <p className="small hint">Filters are optional.</p>
              <button onClick={findCompanies} disabled={busy}>Find companies</button>
            </>
          )}
          {step === "results" && (
            <>
              <p className="small hint">Email drafts are coming next.</p>
              <button onClick={restart}>Start over</button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
