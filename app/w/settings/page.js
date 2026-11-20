"use client";
import Link from "next/link";
import { useWs } from "../../../lib/workspace";
import config from "../../../data/seqa_config.json";

export default function Settings() {
  const { profile } = useWs();
  const label = (id) => config.buyer_categories.find((c) => c.id === id)?.label || id;
  return (
    <>
      <div className="pagehead"><div><h1>Settings</h1><p className="sub">What Seqa knows about your business.</p></div></div>
      <div className="card" style={{ maxWidth: 640 }}>
        <table className="tbl">
          <tbody>
            <tr><td className="small">Your name</td><td>{profile.sender_name}</td></tr>
            <tr><td className="small">Company type</td><td>{profile.type_label}</td></tr>
            <tr><td className="small">You sell</td><td>{profile.sells}</td></tr>
            <tr><td className="small">Selling to</td><td>{(profile.buyer_ids || []).map(label).join(", ")}</td></tr>
            <tr><td className="small">Stage filter</td><td>{profile.stages?.length ? profile.stages.join(", ") : "Any"}</td></tr>
            <tr><td className="small">Size filter</td><td>{profile.sizes?.length ? profile.sizes.join(", ") : "Any"}</td></tr>
          </tbody>
        </table>
        <p><Link href="/start" className="btn">Redo get started</Link></p>
      </div>
    </>
  );
}
