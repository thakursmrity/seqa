"use client";
import { useMemo, useState } from "react";
import config from "../../../data/seqa_config.json";
import ProspectDrawer from "../../../components/ProspectDrawer";
import { useWs, COMPANIES, statusLabel } from "../../../lib/workspace";

export default function Prospects() {
  const { profile, prospects, api, addProspects } = useWs();
  const [cats, setCats] = useState(profile.buyer_ids || []);
  const [stages, setStages] = useState(profile.stages || []);
  const [sizes, setSizes] = useState(profile.sizes || []);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState([]);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const byCompany = Object.fromEntries(prospects.map((p) => [p.company_id, p]));
  const toggle = (list, setList, v) => setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return COMPANIES.filter(
      (c) =>
        (cats.length === 0 || cats.includes(c.category_id)) &&
        (stages.length === 0 || stages.includes(c.stage)) &&
        (sizes.length === 0 || c.funding_size === "Not applicable" || sizes.includes(c.funding_size)) &&
        (!t || c.company.toLowerCase().includes(t) || c.what_they_do.toLowerCase().includes(t))
    );
  }, [cats, stages, sizes, q]);

  async function addPicked() {
    const ids = picked.filter((id) => !byCompany[id]);
    if (!ids.length) { setPicked([]); return; }
    setBusy(true);
    setMsg("Scoring fit...");
    const rowsToAdd = [];
    for (let i = 0; i < ids.length; i += 15) {
      const chunk = ids.slice(i, i + 15);
      const r = await api("/api/score", { typeLabel: profile.type_label, sells: profile.sells, ids: chunk });
      const byId = Object.fromEntries((r.scores || []).map((s) => [s.id, s]));
      chunk.forEach((id) => rowsToAdd.push({ company_id: id, fit: byId[id]?.score, reason: byId[id]?.reason }));
    }
    await addProspects(rowsToAdd);
    setPicked([]);
    setBusy(false);
    setMsg(`${rowsToAdd.length} added to your pipeline.`);
  }

  return (
    <>
      <div className="pagehead">
        <div><h1>Prospects</h1><p className="sub">{rows.length} of {COMPANIES.length} companies match your filters.</p></div>
        <button disabled={busy || picked.length === 0} onClick={addPicked}>{busy ? "Adding..." : `Add selected (${picked.length})`}</button>
      </div>
      {msg && <p className="small">{msg}</p>}
      <div className="split">
        <aside className="filters card">
          <input placeholder="Search companies" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="fh">Category</div>
          {config.buyer_categories.map((c) => (
            <label key={c.id} className="fi"><input type="checkbox" checked={cats.includes(c.id)} onChange={() => toggle(cats, setCats, c.id)} />{c.label}</label>
          ))}
          <div className="fh">Funding stage</div>
          {config.filters.stage.map((s) => (
            <label key={s} className="fi"><input type="checkbox" checked={stages.includes(s)} onChange={() => toggle(stages, setStages, s)} />{s}</label>
          ))}
          <div className="fh">Funding size</div>
          {config.filters.funding_size.filter((s) => s !== "Not applicable").map((s) => (
            <label key={s} className="fi"><input type="checkbox" checked={sizes.includes(s)} onChange={() => toggle(sizes, setSizes, s)} />{s}</label>
          ))}
        </aside>
        <div className="card tablecard">
          <table className="tbl">
            <thead><tr><th></th><th>Company</th><th>Stage</th><th>Funding</th><th>Fit</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((c) => {
                const p = byCompany[c.id];
                return (
                  <tr key={c.id} onClick={() => setOpen(c.id)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      {!p && <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(picked, setPicked, c.id)} />}
                    </td>
                    <td><b>{c.company}</b><div className="small">{c.category}</div></td>
                    <td>{c.stage}</td>
                    <td>{c.funding_size}</td>
                    <td>{p?.fit ? <span className="score">{p.fit}/10</span> : <span className="small">-</span>}</td>
                    <td>{p ? <span className={`pill ${p.status === "new" ? "neu" : "tint"}`}>{statusLabel(p.status)}</span> : <span className="small">Not added</span>}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={6} className="small">No companies match. Clear a filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {open && <ProspectDrawer companyId={open} onClose={() => setOpen(null)} />}
    </>
  );
}
