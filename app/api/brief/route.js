import { requireUser, errorJson } from "../../../lib/server";
import { generateBrief } from "../../../lib/jobs";
import { webCompany } from "../../../lib/finder";
import companies from "../../../data/seqa_companies.json";

export async function POST(req) {
  if (!(await requireUser(req))) return Response.json({ error: "Please log in first." }, { status: 401 });
  const { typeLabel, sells, companyId, company } = await req.json();
  const c = companies.find((x) => x.id === companyId) || (String(companyId).startsWith("web:") ? webCompany(companyId, company) : null);
  if (!c) return Response.json({ error: "Company not found." }, { status: 404 });
  try {
    const brief = await generateBrief({ type_label: typeLabel, sells }, c);
    if (!brief) return Response.json({ error: "Seqa could not write that brief. Try again." }, { status: 500 });
    return Response.json({ brief });
  } catch (e) {
    return errorJson(e);
  }
}
