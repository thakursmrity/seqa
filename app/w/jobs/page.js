"use client";
import Link from "next/link";
import { useWs } from "../../../lib/workspace";
import { Icon, Orb } from "../../../lib/ui";

export default function Jobs() {
  const { prospects, drafts } = useWs();
  const jobs = [
    { n: "Researcher", i: "search", d: "Reads a company's facts and writes a one-page brief: summary, needs, who to contact, an opening angle.", model: "Sonnet", live: true, stat: `${prospects.filter((p) => p.brief).length} briefs written`, href: "/w/pipeline" },
    { n: "Writer", i: "mail", d: "Drafts a short, warm first email grounded in the brief. Never sends it.", model: "Sonnet", live: true, stat: `${drafts.length} drafts written`, href: "/w/outreach" },
    { n: "Scorer", i: "star", d: "Rates how well each company fits what you sell, with a one line reason.", model: "Haiku", live: true, stat: `${prospects.filter((p) => p.fit).length} companies scored`, href: "/w/prospects" },
    { n: "Finder", i: "users", d: "Searches the live web for companies that match who you sell to. Contact finding comes next.", model: "Sonnet", live: true, stat: `${prospects.filter((x) => x.company_id.startsWith("web:")).length} found on the web`, href: "/w/prospects" },
    { n: "Follow up", i: "send", d: "Nudges you when nobody has replied after a few days.", live: false },
    { n: "Reply reader", i: "list", d: "Sorts replies into interested, not now and no.", live: false },
  ];
  return (
    <>
      <div className="pagehead"><div><h1>Jobs</h1><p className="sub">One agent, Seqa, with several jobs. Every result waits for your OK.</p></div><Link href="/w/ask" className="btn"><Icon name="spark" size={16} /> Ask Seqa</Link></div>
      <div className="card hero-card"><Orb size={46} /><div><b>Seqa runs these jobs for you</b><p className="small" style={{ margin: "2px 0 0" }}>Press a button in Prospects or Pipeline, or just ask Seqa in plain words and it chains the jobs together.</p></div></div>
      <div className="agrid" style={{ marginTop: 14 }}>
        {jobs.map((j) => (
          <div key={j.n} className={`card job ${j.live ? "" : "off"}`}>
            <div className="job-top"><span className="job-ic"><Icon name={j.i} size={20} /></span>{j.live ? <span className="pill ok">Active</span> : <span className="pill neu">Not built yet</span>}</div>
            <b className="job-n">{j.n}</b>
            <p className="small">{j.d}</p>
            <div className="job-foot">
              <span className="small">{j.live ? j.stat : "Coming soon"}</span>
              {j.model && <span className="pill tint">{j.model}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
