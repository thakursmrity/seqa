import { requireUser, errorJson } from "../../../lib/server";
import { scoreCompanies } from "../../../lib/scoring";
import companies from "../../../data/seqa_companies.json";

const MAX_CANDIDATES = 15;
const MAX_RESULTS = 8;

export async function POST(req) {
  if (!(await requireUser(req))) return Response.json({ error: "Please log in first." }, { status: 401 });
  const { typeLabel, sells, categoryIds = [], stages = [], sizes = [] } = await req.json();

  // Plain code filters first. Empty means any. Non VC-funded rows ("Not applicable") pass the size filter.
  const pool = companies
    .filter(
      (c) =>
        (categoryIds.length === 0 || categoryIds.includes(c.category_id)) &&
        (stages.length === 0 || stages.includes(c.stage)) &&
        (sizes.length === 0 || c.funding_size === "Not applicable" || sizes.includes(c.funding_size))
    )
    .slice(0, MAX_CANDIDATES);
  if (!pool.length) return Response.json({ results: [] });
  try {
    const scored = await scoreCompanies(pool, typeLabel, sells);
    const byId = Object.fromEntries(pool.map((c) => [c.id, c]));
    const results = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((s) => ({ ...byId[s.id], score: s.score, reason: s.reason }));
    return Response.json({ results });
  } catch (e) {
    return errorJson(e);
  }
}
