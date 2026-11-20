"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWs } from "../../lib/workspace";
import { supabase } from "../../lib/supabase";
import DbSetup from "../../components/DbSetup";

const NAV = [
  ["/w", "Home"],
  ["/w/prospects", "Prospects"],
  ["/w/pipeline", "Pipeline"],
  ["/w/outreach", "Outreach"],
  ["/w/agents", "Seqa agents"],
  ["/w/settings", "Settings"],
];

export default function WorkspaceLayout({ children }) {
  const { session, ready, loaded, profile, drafts, dbError } = useWs();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!session) router.replace("/");
    else if (loaded && !dbError && !profile?.onboarded) router.replace("/start");
  }, [ready, session, loaded, profile, dbError, router]);

  if (!ready || !session) return null;
  if (dbError) return <DbSetup message={dbError} />;
  if (!loaded || !profile?.onboarded) return null;

  const waiting = drafts.filter((d) => d.status === "draft").length;
  return (
    <div className="ws">
      <aside className="side">
        <div className="side-brand"><span className="logo">S</span><strong>Seqa</strong></div>
        <nav>
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className={`nav ${path === href ? "on" : ""}`}>
              {label}
              {label === "Outreach" && waiting > 0 && <span className="count">{waiting}</span>}
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <div className="small">{session.user.email}</div>
          <a href="#" className="small" onClick={(e) => { e.preventDefault(); supabase.auth.signOut(); }}>Log out</a>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
