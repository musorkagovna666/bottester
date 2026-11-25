import { agentTokenOk, requireViewer, unauthorized, NO_STORE } from "@/lib/auth";
import { addFacebookSnapshot } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!agentTokenOk(request)) {
    const identity = await requireViewer(request);
    if (identity instanceof Response) return identity;
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400, headers: NO_STORE });
  }
  const b = body as Record<string, unknown>;
  const leads = Number(b.leads);
  const spend = Number(b.spend);
  if (!Number.isFinite(leads) || leads < 0 || leads > 1_000_000) {
    return Response.json({ error: "leads_invalid" }, { status: 400, headers: NO_STORE });
  }
  if (!Number.isFinite(spend) || spend < 0 || spend > 10_000_000) {
    return Response.json({ error: "spend_invalid" }, { status: 400, headers: NO_STORE });
  }
  const snap = await addFacebookSnapshot({
    jobId: b.jobId ? String(b.jobId) : null,
    leads,
    spend,
    note: b.note ? String(b.note).slice(0, 500) : null,
  });
  return Response.json({ snapshot: snap }, { status: 201, headers: NO_STORE });
}
