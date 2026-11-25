import { agentTokenOk, requireViewer, NO_STORE } from "@/lib/auth";
import { maybeSendScheduledStats, pollTelegramOnce } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!agentTokenOk(request)) {
    const identity = await requireViewer(request);
    if (identity instanceof Response) return identity;
  }
  await pollTelegramOnce();
  const scheduled = await maybeSendScheduledStats();
  return Response.json(scheduled, { headers: NO_STORE });
}
