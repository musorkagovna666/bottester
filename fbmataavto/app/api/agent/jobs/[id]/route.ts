import { agentTokenOk, unauthorized, NO_STORE } from "@/lib/auth";
import { updateJob } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!agentTokenOk(request)) return unauthorized();
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400, headers: NO_STORE });
  }
  const b = body as Record<string, unknown>;
  const status = b.status;
  if (status !== "done" && status !== "error" && status !== "running") {
    return Response.json({ error: "status_invalid" }, { status: 400, headers: NO_STORE });
  }
  const job = await updateJob(id, {
    status,
    result: b.result,
    error: typeof b.error === "string" ? b.error.slice(0, 1000) : null,
  });
  if (!job) return Response.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
  return Response.json({ job }, { headers: NO_STORE });
}
