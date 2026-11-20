"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import companies from "../data/seqa_companies.json";

const Ctx = createContext(null);
export const useWs = () => useContext(Ctx);

export const COMPANIES = companies;
export const companyById = Object.fromEntries(companies.map((c) => [c.id, c]));
export const STATUSES = [
  ["new", "New"],
  ["researched", "Researched"],
  ["contacted", "Contacted"],
  ["replied", "Replied"],
  ["meeting", "Meeting"],
  ["client", "Client"],
];
export const statusLabel = (s) => STATUSES.find((x) => x[0] === s)?.[1] || s;
export const daysAgo = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

export function WorkspaceProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [dbError, setDbError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    if (!session) return;
    const uid = session.user.id;
    const [p, pr, d] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("prospects").select("*").order("created_at", { ascending: false }),
      supabase.from("drafts").select("*").order("created_at", { ascending: false }),
    ]);
    const err = p.error || pr.error || d.error;
    setDbError(err ? err.message : "");
    setProfile(p.data || null);
    setProspects(pr.data || []);
    setDrafts(d.data || []);
    setLoaded(true);
  }, [session]);

  useEffect(() => {
    if (session) load();
    else { setLoaded(false); setProfile(null); setProspects([]); setDrafts([]); }
  }, [session, load]);

  async function api(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function saveProfile(values) {
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: session.user.id, ...values, onboarded: true }, { onConflict: "user_id" });
    if (error) setDbError(error.message);
    await load();
    return error;
  }

  // rows: [{ company_id, fit, reason }]. Existing companies are left untouched.
  async function addProspects(rows) {
    if (!rows.length) return null;
    const payload = rows.map((r) => ({ user_id: session.user.id, company_id: r.company_id, fit: r.fit ?? null, reason: r.reason ?? null }));
    const { error } = await supabase.from("prospects").upsert(payload, { onConflict: "user_id,company_id", ignoreDuplicates: true });
    if (error) setDbError(error.message);
    await load();
    return error;
  }

  async function updateProspect(id, patch) {
    setProspects((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    const { error } = await supabase.from("prospects").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) setDbError(error.message);
  }

  async function removeProspect(id) {
    setProspects((ps) => ps.filter((p) => p.id !== id));
    setDrafts((ds) => ds.filter((d) => d.prospect_id !== id));
    await supabase.from("prospects").delete().eq("id", id);
  }

  async function addDraft(prospect_id, subject, body) {
    const { data, error } = await supabase
      .from("drafts")
      .insert({ user_id: session.user.id, prospect_id, subject, body })
      .select()
      .single();
    if (error) { setDbError(error.message); return null; }
    setDrafts((ds) => [data, ...ds]);
    return data;
  }

  async function updateDraft(id, patch) {
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    const { error } = await supabase.from("drafts").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) setDbError(error.message);
  }

  async function removeDraft(id) {
    setDrafts((ds) => ds.filter((d) => d.id !== id));
    await supabase.from("drafts").delete().eq("id", id);
  }

  const value = {
    session, ready, profile, prospects, drafts, loaded, dbError,
    api, load, saveProfile, addProspects, updateProspect, removeProspect, addDraft, updateDraft, removeDraft,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
