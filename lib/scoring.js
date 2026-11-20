import { SEQA_FAST_MODEL } from "./settings";
import { claude, textOf } from "./server";

// Haiku scores fit and writes one grounded reason per company.
export async function scoreCompanies(pool, typeLabel, sells) {
  if (!pool.length) return [];
  const facts = pool
    .map((c) => `${c.id} | ${c.company} | ${c.category} | ${c.stage} | ${c.what_they_do} | Signal: ${c.why_they_matter}`)
    .join("\n");
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
  const ids = new Set(pool.map((c) => c.id));
  return scored.filter((s) => ids.has(s.id)).map((s) => ({ id: s.id, score: Number(s.score) || 0, reason: String(s.reason || "") }));
}

export function parseJsonObject(raw) {
  try { return JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)); } catch { return null; }
}
