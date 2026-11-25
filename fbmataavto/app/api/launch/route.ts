import { requireViewer, NO_STORE } from "@/lib/auth";
import { enqueueJob, listJobs } from "@/lib/jobs";
import { parseLaunch } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireViewer(request);
  if (identity instanceof Response) return identity;
  const jobs = await listJobs();
  return Response.json({ jobs }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const identity = await requireViewer(request);
  if (identity instanceof Response) return identity;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400, headers: NO_STORE });
  }
  const parsed = parseLaunch(body);
  if (typeof parsed === "string") {
    return Response.json({ error: parsed }, { status: 400, headers: NO_STORE });
  }
  const job = await enqueueJob(parsed);
  return Response.json({ job }, { status: 201, headers: NO_STORE });
}
