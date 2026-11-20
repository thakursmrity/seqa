"use client";
import { useState } from "react";
import Link from "next/link";
import ProspectDrawer from "../../../components/ProspectDrawer";
import { useWs, companyById, STATUSES } from "../../../lib/workspace";

export default function Pipeline() {
  const { prospects, updateProspect } = useWs();
  const [open, setOpen] = useState(null);
  const [over, setOver] = useState("");

  function drop(e, status) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) updateProspect(id, { status });
    setOver("");
  }

  return (
    <>
      <div className="pagehead"><div><h1>Pipeline</h1><p className="sub">Drag a company to move it forward. Click one to open it.</p></div><Link href="/w/prospects" className="btn">Add companies</Link></div>
      <div className="board">
        {STATUSES.map(([key, label]) => {
          const items = prospects.filter((p) => p.status === key);
          return (
            <div key={key} className={`bcol ${over === key ? "over" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(key); }} onDragLeave={() => setOver("")} onDrop={(e) => drop(e, key)}>
              <h4><span>{label}</span><span className="small">{items.length}</span></h4>
              {items.map((p) => {
                const c = companyById[p.company_id];
                return (
                  <div key={p.id} className="kc" draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)} onClick={() => setOpen(p.company_id)}>
                    <b>{c?.company}</b>
                    <div className="small">{c?.stage}</div>
                    <div style={{ marginTop: 6 }}>{p.fit ? <span className="score">Fit {p.fit}/10</span> : null} {p.brief ? <span className="pill tint">Brief</span> : null}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {open && <ProspectDrawer companyId={open} onClose={() => setOpen(null)} />}
    </>
  );
}
