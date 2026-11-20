"use client";
import Link from "next/link";
import { useWs, companyById, STATUSES, daysAgo } from "../../lib/workspace";

export default function HomePage() {
  const { profile, prospects, drafts } = useWs();
  const total = prospects.length;
  const briefs = prospects.filter((p) => p.brief).length;
  const waiting = drafts.filter((d) => d.status === "draft").length;
  const sent = drafts.filter((d) => d.status === "sent").length;
  const count = (s) => prospects.filter((p) => p.status === s).length;

  const funnel = [["In pipeline", total], ["Researched", prospects.filter((p) => p.brief).length], ["Contacted", count("contacted") + count("replied") + count("meeting") + count("client")], ["Replied", count("replied") + count("meeting") + count("client")], ["Meeting", count("meeting") + count("client")], ["Client", count("client")]];
  const top = Math.max(1, funnel[0][1]);

  const tips = [];
  if (total === 0) tips.push({ t: "Add your first companies", d: "Open Prospects and pick the ones that fit you.", href: "/w/prospects" });
  const noBrief = prospects.filter((p) => !p.brief).length;
  if (noBrief > 0) tips.push({ t: `${noBrief} compan${noBrief > 1 ? "ies are" : "y is"} waiting for a brief`, d: "Open one and press Write brief.", href: "/w/pipeline" });
  if (waiting > 0) tips.push({ t: `${waiting} email draft${waiting > 1 ? "s" : ""} waiting for your OK`, d: "Review, edit and open in Gmail.", href: "/w/outreach" });
  prospects.filter((p) => p.status === "contacted" && daysAgo(p.updated_at) >= 3).slice(0, 3).forEach((p) =>
    tips.push({ t: `Follow up with ${companyById[p.company_id]?.company}`, d: `Contacted ${daysAgo(p.updated_at)} days ago with no update.`, href: "/w/pipeline" })
  );

  return (
    <>
      <div className="pagehead"><div><h1>Home</h1><p className="sub">Your sales workspace for {profile.sells}.</p></div><Link href="/w/prospects" className="btn">Find companies</Link></div>
      <div className="stats">
        <div className="card"><div className="small">In pipeline</div><div className="stat">{total}</div></div>
        <div className="card"><div className="small">Briefs written</div><div className="stat">{briefs}</div></div>
        <div className="card"><div className="small">Drafts waiting</div><div className="stat">{waiting}</div></div>
        <div className="card"><div className="small">Emails sent</div><div className="stat">{sent}</div></div>
        <div className="card"><div className="small">Replies</div><div className="stat">{count("replied") + count("meeting") + count("client")}</div></div>
      </div>
      <div className="two">
        <div className="card">
          <b>Pipeline funnel</b>
          {funnel.map(([n, c]) => (
            <div key={n} className="frow"><span className="small" style={{ width: 90 }}>{n}</span><div style={{ flex: 1 }}><div className="bar" style={{ width: `${Math.max(2, (c / top) * 100)}%` }} /></div><b>{c}</b></div>
          ))}
        </div>
        <div className="card">
          <b>Seqa suggests</b>
          {tips.length === 0 && <p className="small">You are all caught up.</p>}
          {tips.map((t, i) => (
            <Link key={i} href={t.href} className="tip"><b>{t.t}</b><span className="small">{t.d}</span></Link>
          ))}
        </div>
      </div>
    </>
  );
}
