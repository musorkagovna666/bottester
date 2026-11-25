import { agentTokenOk, unauthorized, NO_STORE } from "@/lib/auth";
import { nextQueuedJob, updateJob } from "@/lib/jobs";
import { maybeSendScheduledStats, pollTelegramOnce } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!agentTokenOk(request)) return unauthorized();
  try {
    await pollTelegramOnce();
    await maybeSendScheduledStats();
  } catch {
    /* heartbeat side effects */
  }
  const job = await nextQueuedJob();
  if (job) {
    await updateJob(job.id, { status: "running" });
    job.status = "running";
  }
  return Response.json({ job }, { headers: NO_STORE });
}
