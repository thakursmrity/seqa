"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWs } from "../../lib/workspace";
import { supabase } from "../../lib/supabase";
import { Icon, Orb } from "../../lib/ui";
import DbSetup from "../../components/DbSetup";

const NAV = [
  ["/w", "Home", "home"],
  ["/w/prospects", "Prospects", "users"],
  ["/w/pipeline", "Pipeline", "board"],
  ["/w/outreach", "Outreach", "mail"],
  ["/w/jobs", "Jobs", "jobs"],
  ["/w/settings", "Settings", "gear"],
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
        <div className="side-brand"><Orb size={34} /><div><strong>Seqa</strong><div className="tiny"><span className="live" />Live workspace</div></div></div>
        <Link href="/w/ask" className={`ask-cta ${path === "/w/ask" ? "on" : ""}`}>
          <Icon name="spark" /> Ask Seqa
        </Link>
        <nav>
          {NAV.map(([href, label, icon]) => (
            <Link key={href} href={href} className={`nav ${path === href ? "on" : ""}`}>
              <span className="nav-l"><Icon name={icon} />{label}</span>
              {label === "Outreach" && waiting > 0 && <span className="count">{waiting}</span>}
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <div className="small">{session.user.email}</div>
          <a href="#" className="small" onClick={(e) => { e.preventDefault(); supabase.auth.signOut(); }}>Log out</a>
        </div>
      </aside>
      <main className="main" key={path}><div className="page-in">{children}</div></main>
    </div>
  );
}
