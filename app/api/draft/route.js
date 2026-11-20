import { SEQA_MODEL } from "../../../lib/settings";
import { requireUser, claude, textOf, errorJson } from "../../../lib/server";
import { parseJsonObject } from "../../../lib/scoring";
import companies from "../../../data/seqa_companies.json";

// Writer agent: a short, low-pressure first email. Never sent by the app.
export async function POST(req) {
  if (!(await requireUser(req))) return Response.json({ error: "Please log in first." }, { status: 401 });
  const { typeLabel, sells, companyId, contactName, senderName, angle } = await req.json();
  const c = companies.find((x) => x.id === companyId);
  if (!c) return Response.json({ error: "Company not found." }, { status: 404 });
  const first = String(contactName || "").trim().split(/\s+/)[0];
  const greeting = first ? `Hi ${first},` : "Hi there,";
  try {
    const res = await claude().messages.create({
      model: SEQA_MODEL,
      max_tokens: 500,
      system:
        "You are the Writer agent inside Seqa. Write a first cold email from a small business to a prospect. Rules: under 90 words in the body; warm, plain and specific; mention one real fact from the company facts given; one low-pressure question at the end; never invent facts or claims about the sender; no placeholders or brackets; never use em dashes; no hype words. " +
        'Reply with ONLY JSON: {"subject": string under 8 words, "body": string}. The body must start with the exact greeting given and end with the sender name on its own line after a short sign-off.',
      messages: [
        {
          role: "user",
          content: `Greeting: ${greeting}\nSender name: ${String(senderName || "").slice(0, 60)}\nSender company type: ${String(typeLabel).slice(0, 80)}\nWhat the sender sells: ${String(sells).slice(0, 300)}\n\nProspect company: ${c.company}\nWhat they do: ${c.what_they_do}\nSignal: ${c.why_they_matter}\nOutreach angle idea: ${String(angle || "none").slice(0, 200)}`,
        },
      ],
    });
    const d = parseJsonObject(textOf(res));
    if (!d?.subject || !d?.body) return Response.json({ error: "Seqa could not write that email. Try again." }, { status: 500 });
    return Response.json({ subject: d.subject, body: d.body });
  } catch (e) {
    return errorJson(e);
  }
}
