"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import config from "../../data/seqa_config.json";
import { useWs } from "../../lib/workspace";

export default function Start() {
  const { session, ready, api, saveProfile, addProspects } = useWs();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [type, setType] = useState(null);
  const [sells, setSells] = useState("");
  const [say, setSay] = useState("");
  const [options, setOptions] = useState([]);
  const [buyerIds, setBuyerIds] = useState([]);
  const [stages, setStages] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (ready && !session) router.replace("/");
  }, [ready, session, router]);

  useEffect(() => {
    if (!session) return;
    const m = session.user.user_metadata || {};
    setName((n) => n || m.full_name || m.name || "");
  }, [session]);

  const toggle = (list, setList, v) => setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function next1() {
    setBusy(true);
    setMsg("");
    const c = await api("/api/seqa", { kind: "comment", typeLabel: type.label, sells });
    setSay(c.text || "");
    let ids = type.buyer_category_ids;
    if (type.id === "other") {
      const r = await api("/api/seqa", { kind: "classify", sells });
      ids = r.ids?.length ? r.ids : config.buyer_categories.map((x) => x.id);
    }
    setOptions(ids);
    setSay((s) => s || type.seqa_says);
    setBusy(false);
    setStep(2);
  }

  async function finish() {
    setBusy(true);
    setMsg("Seqa is finding your first companies...");
    const err = await saveProfile({
      sender_name: name.trim(), type_id: type.id, type_label: type.label, sells: sells.trim(),
      buyer_ids: buyerIds, stages, sizes,
    });
    if (err) { setBusy(false); setMsg(`Could not save: ${err.message}`); return; }
    const r = await api("/api/shortlist", { typeLabel: type.label, sells, categoryIds: buyerIds, stages, sizes });
    if (r.results?.length) {
      await addProspects(r.results.map((x) => ({ company_id: x.id, fit: x.score, reason: x.reason })));
    }
    router.replace("/w");
  }

  if (!ready || !session) return null;
  const canNext1 = name.trim() && type && sells.trim().length > 2;

  return (
    <div className="start">
      <div className="brand" style={{ marginBottom: 18 }}><span className="logo">S</span><strong>Seqa</strong></div>
      <div className="steps">{[1, 2, 3].map((n) => <div key={n} className={`st ${step >= n ? "on" : ""}`} />)}</div>

      {step === 1 && (
        <>
          <h1>Hi, I'm Seqa. What do you sell?</h1>
          <p className="sub">Step 1 of 3. This takes about a minute.</p>
          <label className="lbl">Your name (used to sign your emails)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" />
          <label className="lbl">Which describes your company best?</label>
          <div className="grid">
            {config.company_types.map((t) => (
              <button key={t.id} type="button" className={`option ${type?.id === t.id ? "on" : ""}`} onClick={() => setType(t)}>
                <strong>{t.label}</strong><span>{t.note}</span>
              </button>
            ))}
          </div>
          <label className="lbl">In one line, what does your product do?</label>
          <input value={sells} onChange={(e) => setSells(e.target.value)} placeholder="B2B invoicing and payouts" />
          <div className="actions"><span /><button disabled={!canNext1 || busy} onClick={next1}>{busy ? "One moment..." : "Next"}</button></div>
          {msg && <p className="small">{msg}</p>}
        </>
      )}

      {step === 2 && (
        <>
          <h1>Who do you want to sell to?</h1>
          <p className="sub">Step 2 of 3. Pick one or more.</p>
          {say && <div className="seqa-say"><span className="avatar">S</span><div className="msg seqa">{say}</div></div>}
          <div className="grid">
            {options.map((id) => {
              const c = config.buyer_categories.find((x) => x.id === id);
              return (
                <button key={id} type="button" className={`option ${buyerIds.includes(id) ? "on" : ""}`} onClick={() => toggle(buyerIds, setBuyerIds, id)}>
                  <strong>{c.label}</strong><span>{c.note}</span>
                </button>
              );
            })}
          </div>
          <div className="actions">
            <button className="ghost" onClick={() => setStep(1)}>Back</button>
            <button disabled={buyerIds.length === 0} onClick={() => setStep(3)}>Next</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h1>Any filters?</h1>
          <p className="sub">Step 3 of 3. Both are optional. Leave them empty for any.</p>
          <label className="lbl">Funding stage</label>
          <div className="chips">
            {config.filters.stage.map((s) => <button key={s} type="button" className={`chip ${stages.includes(s) ? "on" : ""}`} onClick={() => toggle(stages, setStages, s)}>{s}</button>)}
          </div>
          <label className="lbl">Funding size</label>
          <div className="chips">
            {config.filters.funding_size.filter((s) => s !== "Not applicable").map((s) => <button key={s} type="button" className={`chip ${sizes.includes(s) ? "on" : ""}`} onClick={() => toggle(sizes, setSizes, s)}>{s}</button>)}
          </div>
          <div className="actions">
            <button className="ghost" disabled={busy} onClick={() => setStep(2)}>Back</button>
            <button disabled={busy} onClick={finish}>{busy ? "Setting up..." : "Open my workspace"}</button>
          </div>
          {msg && <p className="small">{msg}</p>}
        </>
      )}
    </div>
  );
}
