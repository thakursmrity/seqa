import { authUser } from "../../../lib/server";
import { findPeople, findEmail } from "../../../lib/crustdata";
import companies from "../../../data/seqa_companies.json";

export const maxDuration = 30;

export async function POST(req) {
  const auth = await authUser(req);
  if (!auth) return Response.json({ error: "Please log in first." }, { status: 401 });
  const body = await req.json();
  try {
    if (body.action === "email") {
      const url = String(body.profileUrl || "");
      if (!/^https:\/\/([a-z]+\.)?linkedin\.com\/in\//i.test(url)) return Response.json({ error: "That profile link is not valid." }, { status: 400 });
      const email = await findEmail(url);
      return Response.json({ email });
    }
    const c = companies.find((x) => x.id === body.companyId);
    const name = c?.company || String(body.name || "").slice(0, 120);
    const website = String(body.website || "").slice(0, 200);
    if (!name && !website) return Response.json({ error: "Company not found." }, { status: 404 });
    const titles = (Array.isArray(body.titles) ? body.titles : []).map((t) => String(t).slice(0, 60));
    const people = await findPeople({ website, name }, titles, 5);
    return Response.json({ people });
  } catch (e) {
    const msg = e?.setup ? e.message
      : e?.status === 402 || e?.status === 403 ? "Crustdata refused the request. Check that the account has credits and access."
      : `Could not look up contacts. ${String(e?.message || "").slice(0, 160)}`;
    return Response.json({ error: msg }, { status: 500 });
  }
}
