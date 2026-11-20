"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signup");
  const [note, setNote] = useState("");

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
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) setNote(error.message);
  }

  return (
    <div className="wrap">
      <span className="badge">Being built in public</span>
      <h1>Seqa</h1>
      <p className="sub">A simple sales workspace for small teams. A Sequor AI project.</p>
      <div className="card">
        <button type="button" onClick={google} style={{ width: "100%", marginBottom: 12 }}>Continue with Google</button>
        <p className="small" style={{ textAlign: "center" }}>or use email and password</p>
        <form onSubmit={login}>
          <p>{mode === "signup" ? "Create your account to start." : "Welcome back. Log in to continue."}</p>
          <input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required minLength={6} placeholder="Password (6+ characters)" style={{ marginTop: 8 }} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" style={{ marginTop: 10 }}>{mode === "signup" ? "Sign up" : "Log in"}</button>
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
