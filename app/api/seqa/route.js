import { SEQA_MODEL, SEQA_FAST_MODEL, SEQA_SYSTEM } from "../../../lib/settings";
import { requireUser, claude, textOf, errorJson } from "../../../lib/server";
import config from "../../../data/seqa_config.json";

// kind "comment": one friendly sentence after the user describes their product.
// kind "classify": for "Other" companies, pick the buyer categories that fit.
export async function POST(req) {
  if (!(await requireUser(req))) {
    return Response.json({ error: "Please log in first." }, { status: 401 });
  }
  const { kind, typeLabel, sells } = await req.json();
  const clean = String(sells || "").slice(0, 300);
  const client = claude();
  try {
    if (kind === "classify") {
      const list = config.buyer_categories.map((c) => `${c.id}: ${c.label}`).join("\n");
      const res = await client.messages.create({
        model: SEQA_FAST_MODEL,
        max_tokens: 100,
        system: "Pick the 3 or 4 buyer category ids most likely to buy this product. Reply with ONLY a JSON array of ids.",
        messages: [{ role: "user", content: `Product: ${clean}\n\nCategories:\n${list}` }],
      });
      const raw = textOf(res);
      let ids = [];
      try { ids = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1)); } catch {}
      const valid = ids.filter((id) => config.buyer_categories.some((c) => c.id === id));
      return Response.json({ ids: valid });
    }
    const res = await client.messages.create({
      model: SEQA_MODEL,
      max_tokens: 100,
      system: SEQA_SYSTEM,
      messages: [{ role: "user", content: `Company type: ${typeLabel}. They sell: ${clean}. Write one short, warm sentence acknowledging this.` }],
    });
    return Response.json({ text: textOf(res).trim() });
  } catch (e) {
    return errorJson(e);
  }
}
