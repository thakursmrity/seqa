import { SEQA_MODEL } from "../../../lib/settings";
import { requireUser, claude, textOf, errorJson } from "../../../lib/server";
import { parseJsonObject } from "../../../lib/scoring";
import companies from "../../../data/seqa_companies.json";

// Researcher agent: one-page brief grounded only in the saved company facts.
export async function POST(req) {
  if (!(await requireUser(req))) return Response.json({ error: "Please log in first." }, { status: 401 });
  const { typeLabel, sells, companyId } = await req.json();
  const c = companies.find((x) => x.id === companyId);
  if (!c) return Response.json({ error: "Company not found." }, { status: 404 });
  try {
    const res = await claude().messages.create({
      model: SEQA_MODEL,
      max_tokens: 700,
      system:
        "You are the Researcher agent inside Seqa, a sales tool for small businesses. Use ONLY the facts provided. Never invent facts, numbers, names or events. Never use em dashes. " +
        'Reply with ONLY JSON: {"summary": string under 45 words, "needs": [3 strings, each under 22 words, why this company may need the seller\'s product], "buyers": [2 or 3 job titles likely to decide], "angle": string under 30 words, a first-line idea for outreach}.',
      messages: [
        {
          role: "user",
          content: `Seller type: ${String(typeLabel).slice(0, 80)}\nSeller product: ${String(sells).slice(0, 300)}\n\nCompany: ${c.company}\nCategory: ${c.category}\nStage: ${c.stage}\nFunding: ${c.funding_size}\nWhat they do: ${c.what_they_do}\nSignal: ${c.why_they_matter}\nSource: ${c.source_url}`,
        },
      ],
    });
    const brief = parseJsonObject(textOf(res));
    if (!brief) return Response.json({ error: "Seqa could not write that brief. Try again." }, { status: 500 });
    return Response.json({ brief: { ...brief, source_url: c.source_url } });
  } catch (e) {
    return errorJson(e);
  }
}
