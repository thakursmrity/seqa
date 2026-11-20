import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Only logged-in users may call the AI routes.
export async function requireUser(req) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data, error } = await supabase.auth.getUser(token);
  return error || !data?.user ? null : data.user;
}

export function claude() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export function textOf(res) {
  return res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

export function errorJson(e) {
  console.error("Seqa AI call failed:", e?.status, e?.message);
  const detail = `${e?.status || ""} ${e?.message || "unknown error"}`.trim().slice(0, 300);
  return Response.json({ error: `Seqa could not reply. Reason: ${detail}` }, { status: 500 });
}
