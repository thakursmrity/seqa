import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { SEQA_MODEL, SEQA_SYSTEM } from "../../../lib/settings";

export async function POST(req) {
  // 1. Only logged-in users can call Seqa.
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return Response.json({ error: "Please log in first." }, { status: 401 });
  }

  // 2. Call Claude on the server. The API key never reaches the browser.
  const { messages } = await req.json();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const res = await client.messages.create({
      model: SEQA_MODEL,
      max_tokens: 400,
      system: SEQA_SYSTEM,
      messages,
    });
    const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    return Response.json({ text });
  } catch (e) {
    console.error("Seqa Claude call failed:", e?.status, e?.message);
    const detail = `${e?.status || ""} ${e?.message || "unknown error"}`.trim().slice(0, 300);
    return Response.json({ error: `Seqa could not reply. Reason: ${detail}` }, { status: 500 });
  }
}
