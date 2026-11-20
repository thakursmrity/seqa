// Crustdata client. The key lives only on the server (CRUSTDATA_API_KEY in Vercel).
const BASE = "https://api.crustdata.com";

async function cd(path, body) {
  const key = process.env.CRUSTDATA_API_KEY;
  if (!key) {
    const e = new Error("Contact finding is not switched on yet. Add CRUSTDATA_API_KEY in Vercel.");
    e.setup = true;
    throw e;
  }
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json", "x-api-version": "2025-11-01" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (!res.ok) {
    const e = new Error(json?.error?.message || json?.message || `Crustdata error ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return json;
}

const host = (u) => { try { return new URL(/^https?:/.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, ""); } catch { return ""; } };
const first = (v) => (Array.isArray(v) ? v[0] : v);
const rowsOf = (r) => (Array.isArray(r) ? r : r?.profiles || r?.results || r?.data || r?.people || []);

// People at a company with matching job titles. Costs about 0.03 credits per person returned.
export async function findPeople({ website, name }, titles, limit = 5) {
  const domain = host(website || "");
  const company = domain
    ? { field: "experience.employment_details.current.company_website_domain", type: "=", value: domain }
    : { field: "experience.employment_details.current.name", type: "(.)", value: String(name || "").slice(0, 100) };
  const t = titles.filter(Boolean).slice(0, 6).map((x) => ({ field: "experience.employment_details.current.title", type: "(.)", value: String(x).slice(0, 60) }));
  const filters = t.length ? { op: "and", conditions: [company, { op: "or", conditions: t }] } : company;
  const r = await cd("/person/search", {
    filters,
    limit: Math.min(limit, 8),
    fields: ["basic_profile.name", "experience.employment_details.current.title", "social_handles.professional_network_identifier.profile_url"],
  });
  return rowsOf(r)
    .map((p) => {
      const cur = first(p?.experience?.employment_details?.current);
      return {
        name: p?.basic_profile?.name || "",
        title: cur?.title || "",
        profile_url: p?.social_handles?.professional_network_identifier?.profile_url || "",
      };
    })
    .filter((p) => p.name && p.profile_url);
}

function deepEmails(x, out = []) {
  if (!x || typeof x !== "object") return out;
  for (const [k, v] of Object.entries(x)) {
    if (k === "business_emails" && Array.isArray(v)) v.forEach((e) => out.push(typeof e === "string" ? e : e?.email || e?.value));
    else deepEmails(v, out);
  }
  return out;
}

// Business email for one person. Costs about 2 credits when an email is returned, nothing otherwise.
export async function findEmail(profileUrl) {
  const r = await cd("/person/enrich", { professional_network_profile_urls: [profileUrl], fields: ["contact.business_emails"] });
  const emails = deepEmails(r).filter((e) => typeof e === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  return emails[0] || "";
}
