import { SEQA_MODEL } from "../../../lib/settings";
import { authUser, claude, errorJson } from "../../../lib/server";
import { scoreCompanies } from "../../../lib/scoring";
import { generateBrief, generateDraft } from "../../../lib/jobs";
import { findCompanies, webCompany } from "../../../lib/finder";
import config from "../../../data/seqa_config.json";
import companies from "../../../data/seqa_companies.json";

export const maxDuration = 60;

const MAX_STEPS = 8;
const MAX_WRITES = 6; // briefs plus drafts per request, to keep spend predictable
const MAX_ADD = 8;
const byId = Object.fromEntries(companies.map((c) => [c.id, c]));
const catIds = config.buyer_categories.map((c) => c.id);

const TOOLS = [
  {
    name: "search_companies",
    description: `Search the curated company list. Category ids: ${catIds.join(", ")}. Returns up to 12 companies with ids. Use before adding anything.`,
    input_schema: {
      type: "object",
      properties: {
        category_ids: { type: "array", items: { type: "string" } },
        stages: { type: "array", items: { type: "string" }, description: `Any of: ${config.filters.stage.join("; ")}` },
        sizes: { type: "array", items: { type: "string" }, description: `Any of: ${config.filters.funding_size.join("; ")}` },
        query: { type: "string", description: "Optional text to match in name or description" },
        limit: { type: "integer" },
      },
    },
  },
  {
    name: "find_companies_web",
    description: "Finder job: search the live web for real organisations matching a plain description of who the user sells to (for example private schools in Punjab). Use when the curated list does not cover the request. Returns candidates with ids starting web:, a fit score and a reason. Slow and costs more, so use it at most once per request.",
    input_schema: { type: "object", properties: { description: { type: "string" }, count: { type: "integer" } }, required: ["description"] },
  },
  {
    name: "score_companies",
    description: "Score how well up to 15 companies fit what the user sells (1 to 10) with a one line reason.",
    input_schema: { type: "object", properties: { ids: { type: "array", items: { type: "string" } } }, required: ["ids"] },
  },
  {
    name: "add_to_pipeline",
    description: `Add companies to the user's pipeline (max ${MAX_ADD} per call). Include fit and reason if known.`,
    input_schema: {
      type: "object",
      properties: {
        companies: {
          type: "array",
          items: { type: "object", properties: { id: { type: "string" }, fit: { type: "integer" }, reason: { type: "string" } }, required: ["id"] },
        },
      },
      required: ["companies"],
    },
  },
  {
    name: "write_brief",
    description: "Run the Researcher job: write a one-page brief for a company that is already in the pipeline.",
    input_schema: { type: "object", properties: { company_id: { type: "string" } }, required: ["company_id"] },
  },
  {
    name: "draft_email",
    description: "Run the Writer job: save a first email draft for a company in the pipeline. This never sends anything.",
    input_schema: { type: "object", properties: { company_id: { type: "string" }, contact_name: { type: "string" } }, required: ["company_id"] },
  },
  {
    name: "list_pipeline",
    description: "List the user's pipeline with status, fit, whether a brief exists, and the number of drafts.",
    input_schema: { type: "object", properties: {} },
  },
];

export async function POST(req) {
  const auth = await authUser(req);
  if (!auth) return Response.json({ error: "Please log in first." }, { status: 401 });
  const { user, db } = auth;

  const body = await req.json();
  const message = String(body.message || "").slice(0, 800);
  if (!message.trim()) return Response.json({ error: "Type a request for Seqa." }, { status: 400 });
  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));

  const { data: profile } = await db.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile?.onboarded) return Response.json({ error: "Finish Get started first." }, { status: 400 });

  const { data: rows } = await db.from("prospects").select("*");
  const pipeline = Object.fromEntries((rows || []).map((r) => [r.company_id, r]));
  const { data: draftRows } = await db.from("drafts").select("id,prospect_id");
  const draftCount = (pid) => (draftRows || []).filter((d) => d.prospect_id === pid).length;

  const actions = [];
  const webFound = {};
  let writes = 0;

  async function run(name, input) {
    if (name === "search_companies") {
      const lim = Math.min(Number(input.limit) || 8, 12);
      const t = (input.query || "").toLowerCase();
      const found = companies
        .filter(
          (c) =>
            (!input.category_ids?.length || input.category_ids.includes(c.category_id)) &&
            (!input.stages?.length || input.stages.includes(c.stage)) &&
            (!input.sizes?.length || c.funding_size === "Not applicable" || input.sizes.includes(c.funding_size)) &&
            (!t || c.company.toLowerCase().includes(t) || c.what_they_do.toLowerCase().includes(t))
        )
        .slice(0, lim);
      actions.push({ type: "search", text: `Searched companies, found ${found.length}` });
      return found.map((c) => ({ id: c.id, company: c.company, category_id: c.category_id, stage: c.stage, funding: c.funding_size, what: c.what_they_do.slice(0, 100), in_pipeline: !!pipeline[c.id] }));
    }
    if (name === "find_companies_web") {
      if (Object.keys(webFound).length) return { error: "Already searched the web in this request." };
      const list = await findCompanies(profile, input.description || "", input.count || 6);
      list.forEach((c) => (webFound[c.id] = c));
      actions.push({ type: "search", text: `Searched the web, found ${list.length}` });
      return list.map((c) => ({ id: c.id, company: c.company, location: c.location, what: c.what_they_do, fit: c.fit, in_pipeline: !!pipeline[c.id] }));
    }
    if (name === "score_companies") {
      const pool = (input.ids || []).slice(0, 15).map((id) => byId[id]).filter(Boolean);
      const scores = await scoreCompanies(pool, profile.type_label, profile.sells);
      actions.push({ type: "score", text: `Scored ${scores.length} companies for fit` });
      return scores;
    }
    if (name === "add_to_pipeline") {
      const known = (x) => byId[x.id] || webFound[x.id];
      const list = (input.companies || []).slice(0, MAX_ADD).filter((x) => known(x) && !pipeline[x.id]);
      if (!list.length) return { added: 0, note: "Those companies are already in the pipeline or unknown." };
      const payload = list.map((x) => ({ user_id: user.id, company_id: x.id, fit: Number.isFinite(x.fit) ? x.fit : webFound[x.id]?.fit ?? null, reason: x.reason || webFound[x.id]?.reason || null, ...(webFound[x.id] ? { company: webFound[x.id] } : {}) }));
      const { data, error } = await db.from("prospects").upsert(payload, { onConflict: "user_id,company_id", ignoreDuplicates: true }).select();
      if (error) return { error: error.message };
      (data || []).forEach((r) => (pipeline[r.company_id] = r));
      actions.push({ type: "add", text: `Added ${data?.length || 0} to your pipeline: ${list.map((x) => known(x).company).join(", ")}` });
      return { added: data?.length || 0 };
    }
    if (name === "write_brief" || name === "draft_email") {
      const row = pipeline[input.company_id];
      if (!row) return { error: "That company is not in the pipeline yet. Add it first." };
      if (writes >= MAX_WRITES) return { error: "Limit reached for this request. Tell the user to ask again for the rest." };
      writes += 1;
      const c = byId[input.company_id] || webCompany(input.company_id, row.company || {});
      if (name === "write_brief") {
        const brief = await generateBrief(profile, c);
        if (!brief) return { error: "Could not write the brief." };
        const patch = { brief, status: row.status === "new" ? "researched" : row.status, updated_at: new Date().toISOString() };
        await db.from("prospects").update(patch).eq("id", row.id);
        pipeline[c.id] = { ...row, ...patch };
        actions.push({ type: "brief", text: `Wrote a brief on ${c.company}` });
        return { company: c.company, summary: brief.summary, angle: brief.angle };
      }
      const d = await generateDraft(profile, c, { contactName: input.contact_name || row.contact_name, senderName: profile.sender_name, angle: row.brief?.angle });
      if (!d) return { error: "Could not write the email." };
      await db.from("drafts").insert({ user_id: user.id, prospect_id: row.id, subject: d.subject, body: d.body });
      actions.push({ type: "draft", text: `Drafted an email to ${c.company}` });
      return { company: c.company, subject: d.subject, saved_as: "draft, not sent" };
    }
    if (name === "list_pipeline") {
      actions.push({ type: "list", text: "Checked your pipeline" });
      return Object.values(pipeline).map((r) => ({ company_id: r.company_id, company: byId[r.company_id]?.company || r.company?.company, status: r.status, fit: r.fit, has_brief: !!r.brief, drafts: draftCount(r.id) }));
    }
    return { error: "Unknown job." };
  }

  const system = `You are Seqa, the single assistant inside a simple sales workspace for small teams. You run jobs for the user with your tools: search, score, add to pipeline, write briefs (Researcher), draft emails (Writer), and list the pipeline.
The user: ${profile.sender_name || "the user"}. Company type: ${profile.type_label}. They sell: ${profile.sells}. Their chosen buyer categories: ${(profile.buyer_ids || []).join(", ") || "none"}.
Rules:
- Do the work with tools, do not just describe it. Chain jobs when asked, for example search, then score, then add the best, then write briefs.
- Prefer the curated list. Use find_companies_web only when the request is about something the curated list does not cover, such as schools or local businesses.
- Use the user's buyer categories when they do not name one. Add at most 5 companies unless asked for more.
- You can only draft emails. You can never send them. Say drafts are waiting in Outreach for the user to review.
- Only use companies returned by your tools. Never invent companies, facts or contact details.
- Reply in under 110 words, plain and warm, with short lines. You may use "- " bullets. Never use em dashes. End with the one next step for the user.
- If asked for something your tools cannot do, say so in one line and suggest what you can do.`;

  const client = claude();
  const messages = [...history, { role: "user", content: message }];
  try {
    let text = "";
    for (let i = 0; i < MAX_STEPS; i++) {
      const res = await client.messages.create({ model: SEQA_MODEL, max_tokens: 900, system, tools: TOOLS, messages });
      messages.push({ role: "assistant", content: res.content });
      const calls = res.content.filter((b) => b.type === "tool_use");
      if (res.stop_reason !== "tool_use" || !calls.length) {
        text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
        break;
      }
      const results = [];
      for (const call of calls) {
        let out;
        try { out = await run(call.name, call.input || {}); } catch (e) { out = { error: String(e?.message || e).slice(0, 200) }; }
        results.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify(out).slice(0, 6000) });
      }
      messages.push({ role: "user", content: results });
    }
    if (!text) text = "I did what I could in this round. Open Pipeline to see the results, then ask me to continue.";
    return Response.json({ text, actions });
  } catch (e) {
    return errorJson(e);
  }
}
