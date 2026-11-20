"use client";
import { useState } from "react";
import { useWs, meOf } from "../../../lib/workspace";
import { supabase } from "../../../lib/supabase";
import { Avatar, AVATAR_COLORS, AVATAR_EMOJIS } from "../../../lib/ui";

export default function Profile() {
  const { session, profile, saveProfile } = useWs();
  const me = meOf(session.user, profile);
  const [first, setFirst] = useState(me.first);
  const [last, setLast] = useState(me.last);
  const [emoji, setEmoji] = useState(me.emoji);
  const [hue, setHue] = useState(me.hue ?? AVATAR_COLORS[0]);
  const [state, setState] = useState("");

  const full = `${first} ${last}`.trim() || session.user.email.split("@")[0];

  async function save() {
    setState("Saving...");
    const { error } = await supabase.auth.updateUser({ data: { first_name: first.trim(), last_name: last.trim(), avatar_emoji: emoji, avatar_hue: hue } });
    if (error) return setState(`Could not save: ${error.message}`);
    await saveProfile({ sender_name: `${first} ${last}`.trim() || profile.sender_name, type_id: profile.type_id, type_label: profile.type_label, sells: profile.sells, buyer_ids: profile.buyer_ids, stages: profile.stages, sizes: profile.sizes });
    setState("Saved");
    setTimeout(() => setState(""), 2500);
  }

  return (
    <>
      <div className="pagehead"><div><h1>Your profile</h1><p className="sub">Your name goes on the emails Seqa drafts for you.</p></div></div>
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="prof-top">
          <Avatar name={full} size={84} emoji={emoji} hue={hue} />
          <div><b style={{ fontSize: 20 }}>{full}</b><div className="small">{session.user.email}</div></div>
        </div>

        <span className="lbl">Avatar</span>
        <div className="emoji-grid">
          {AVATAR_EMOJIS.map((e) => (
            <button key={e || "initial"} type="button" className={`emo ghost ${emoji === e ? "on" : ""}`} onClick={() => setEmoji(e)}>{e || "Aa"}</button>
          ))}
        </div>
        <span className="lbl">Colour</span>
        <div className="hue-row">
          {AVATAR_COLORS.map((h) => (
            <button key={h} type="button" aria-label={`Colour ${h}`} className={`hue ${hue === h ? "on" : ""}`} style={{ background: `linear-gradient(135deg, hsl(${h} 70% 62%), hsl(${(h + 40) % 360} 70% 52%))` }} onClick={() => setHue(h)} />
          ))}
        </div>

        <div className="two-in">
          <div><span className="lbl">First name</span><input value={first} onChange={(e) => setFirst(e.target.value)} /></div>
          <div><span className="lbl">Last name</span><input value={last} onChange={(e) => setLast(e.target.value)} /></div>
        </div>
        <span className="lbl">Email</span>
        <input value={session.user.email} disabled />

        <div className="actions" style={{ justifyContent: "flex-start", alignItems: "center", gap: 14 }}>
          <button onClick={save}>Save profile</button>
          <span className="small">{state}</span>
        </div>
      </div>
    </>
  );
}
