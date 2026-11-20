import { authUser, errorJson } from "../../../lib/server";
import { findCompanies } from "../../../lib/finder";

export const maxDuration = 60;

export async function POST(req) {
  const auth = await authUser(req);
  if (!auth) return Response.json({ error: "Please log in first." }, { status: 401 });
  const { description, count } = await req.json();
  if (!String(description || "").trim()) return Response.json({ error: "Describe who you sell to." }, { status: 400 });
  const { data: profile } = await auth.db.from("profiles").select("*").eq("user_id", auth.user.id).maybeSingle();
  if (!profile?.onboarded) return Response.json({ error: "Finish Get started first." }, { status: 400 });
  try {
    const companies = await findCompanies(profile, description, count);
    return Response.json({ companies });
  } catch (e) {
    return errorJson(e);
  }
}
