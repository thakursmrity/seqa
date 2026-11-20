import { requireUser, errorJson } from "../../../lib/server";
import { scoreCompanies } from "../../../lib/scoring";
import companies from "../../../data/seqa_companies.json";

// Scores specific companies the user picked. Max 15 per call.
export async function POST(req) {
  if (!(await requireUser(req))) return Response.json({ error: "Please log in first." }, { status: 401 });
  const { typeLabel, sells, ids = [] } = await req.json();
  const wanted = new Set(ids.slice(0, 15));
  const pool = companies.filter((c) => wanted.has(c.id));
  try {
    return Response.json({ scores: await scoreCompanies(pool, typeLabel, sells) });
  } catch (e) {
    return errorJson(e);
  }
}
