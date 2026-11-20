"use client";
import { useWs } from "../../../lib/workspace";

export default function Agents() {
  const { prospects, drafts } = useWs();
  const briefs = prospects.filter((p) => p.brief).length;
  const agents = [
    { n: "Researcher", d: "Writes a one-page brief on a company", live: true, stat: `${briefs} brief${briefs === 1 ? "" : "s"} written` },
    { n: "Writer", d: "Drafts first emails in your voice", live: true, stat: `${drafts.length} draft${drafts.length === 1 ? "" : "s"} written` },
    { n: "Scorer", d: "Rates how well each company fits what you sell", live: true, stat: `${prospects.filter((p) => p.fit).length} companies scored` },
    { n: "Finder", d: "Looks for new companies that fit you", live: false, stat: "Coming soon" },
    { n: "Follow up", d: "Nudges you when nobody replies", live: false, stat: "Coming soon" },
    { n: "Reply reader", d: "Sorts replies into interested, not now and no", live: false, stat: "Coming soon" },
  ];
  return (
    <>
      <div className="pagehead"><div><h1>Seqa agents</h1><p className="sub">Each agent does one job. Every result waits for your OK.</p></div></div>
      <div className="agrid">
        {agents.map((a) => (
          <div key={a.n} className="card">
            <div className="agent-row"><span className="avatar">S</span><div><b>{a.n}</b><div className="small">{a.d}</div></div></div>
            <div style={{ marginTop: 12 }}><span className={`pill ${a.live ? "ok" : "neu"}`}>{a.live ? "Active" : "Not built yet"}</span></div>
            <p className="small">{a.stat}</p>
          </div>
        ))}
      </div>
    </>
  );
}
