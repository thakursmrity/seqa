import { SEQA_FAST_MODEL } from "../../../lib/settings";
import { requireUser, claude, textOf, errorJson } from "../../../lib/server";
import companies from "../../../data/seqa_companies.json";

const MAX_CANDIDATES = 15;
const MAX_RESULTS = 8;

export async function POST(req) {
  if (!(await requireUser(req))) {
    return Response.json({ error: "Please log in first." }, { status: 401 });
  }
  const { typeLabel, sells, categoryIds = [], stages = [], sizes = [] } = await req.json();

  // 1. Filter with plain code. Empty filter means "any".
  // Rows with size "Not applicable" (non VC-funded firms) are never removed by the size filter.
  let pool = companies.filter(
    (c) =>
      (categoryIds.length === 0 || categoryIds.includes(c.category_id)) &&
      (stages.length === 0 || stages.includes(c.stage)) &&
      (sizes.length === 0 || c.funding_size === "Not applicable" || sizes.includes(c.funding_size))
  );
  if (pool.length === 0) return Response.json({ results: [] });
  pool = pool.slice(0, MAX_CANDIDATES);

  // 2. Haiku scores fit and writes one grounded reason per company.
  const facts = pool
    .map((c) => `${c.id} | ${c.company} | ${c.category} | ${c.stage} | ${c.what_they_do} | Signal: ${c.why_they_matter}`)
    .join("\n");
  try {
    const res = await claude().messages.create({
      model: SEQA_FAST_MODEL,
      max_tokens: 1800,
      system:
        "You rank sales prospects. Use ONLY the facts given for each company. Never invent facts. Never use em dashes. " +
        'Reply with ONLY a JSON array of objects: {"id": string, "score": integer 1 to 10, "reason": one sentence under 30 words saying why this company may need the seller\'s product}.',
      messages: [
        {
          role: "user",
          content: `Seller type: ${String(typeLabel).slice(0, 80)}\nSeller product: ${String(sells).slice(0, 300)}\n\nCompanies (id | name | category | stage | what they do | signal):\n${facts}`,
        },
      ],
    });
    const raw = textOf(res);
    let scored = [];
    try { scored = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1)); } catch {}
    const byId = Object.fromEntries(pool.map((c) => [c.id, c]));
    const results = scored
      .filter((s) => byId[s.id])
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((s) => ({ ...byId[s.id], score: s.score, reason: s.reason }));
    return Response.json({ results });
  } catch (e) {
    return errorJson(e);
  }
}
