import { SEQA_MODEL } from "./settings";
import { claude, textOf } from "./server";
import { parseJsonObject } from "./scoring";

// Researcher job: one-page brief grounded only in the saved company facts.
export async function generateBrief(profile, c) {
  const res = await claude().messages.create({
    model: SEQA_MODEL,
    max_tokens: 700,
    system:
      "You are the Researcher job inside Seqa, a sales tool for small businesses. Use ONLY the facts provided. Never invent facts, numbers, names or events. Never use em dashes. " +
      'Reply with ONLY JSON: {"summary": string under 45 words, "needs": [3 strings, each under 22 words, why this company may need the seller\'s product], "buyers": [2 or 3 job titles likely to decide], "angle": string under 30 words, a first-line idea for outreach}.',
    messages: [
      {
        role: "user",
        content: `Seller type: ${String(profile.type_label).slice(0, 80)}\nSeller product: ${String(profile.sells).slice(0, 300)}\n\nCompany: ${c.company}\nCategory: ${c.category}\nStage: ${c.stage}\nFunding: ${c.funding_size}\nWhat they do: ${c.what_they_do}\nSignal: ${c.why_they_matter}\nSource: ${c.source_url}`,
      },
    ],
  });
  const brief = parseJsonObject(textOf(res));
  return brief ? { ...brief, source_url: c.source_url } : null;
}

// Writer job: a short, low-pressure first email. Never sent by the app.
export async function generateDraft(profile, c, { contactName, senderName, angle } = {}) {
  const first = String(contactName || "").trim().split(/\s+/)[0];
  const greeting = first ? `Hi ${first},` : "Hi there,";
  const res = await claude().messages.create({
    model: SEQA_MODEL,
    max_tokens: 500,
    system:
      "You are the Writer job inside Seqa. Write a first cold email from a small business to a prospect. Rules: under 90 words in the body; warm, plain and specific; mention one real fact from the company facts given; one low-pressure question at the end; never invent facts or claims about the sender; no placeholders or brackets; never use em dashes; no hype words. " +
      'Reply with ONLY JSON: {"subject": string under 8 words, "body": string}. The body must start with the exact greeting given and end with the sender name on its own line after a short sign-off.',
    messages: [
      {
        role: "user",
        content: `Greeting: ${greeting}\nSender name: ${String(senderName || "").slice(0, 60)}\nSender company type: ${String(profile.type_label).slice(0, 80)}\nWhat the sender sells: ${String(profile.sells).slice(0, 300)}\n\nProspect company: ${c.company}\nWhat they do: ${c.what_they_do}\nSignal: ${c.why_they_matter}\nOutreach angle idea: ${String(angle || "none").slice(0, 200)}`,
      },
    ],
  });
  const d = parseJsonObject(textOf(res));
  return d?.subject && d?.body ? { subject: d.subject, body: d.body } : null;
}
