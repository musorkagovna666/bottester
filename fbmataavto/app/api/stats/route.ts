import { requireViewer, NO_STORE } from "@/lib/auth";
import { reconciledStats } from "@/lib/metrics";
import { maybeSendScheduledStats, pollTelegramOnce } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireViewer(request);
  if (identity instanceof Response) return identity;
  try {
    await pollTelegramOnce();
  } catch {
    /* telegram poll is best-effort */
  }
  try {
    await maybeSendScheduledStats();
  } catch {
    /* scheduled send is best-effort */
  }
  try {
    const stats = await reconciledStats();
    return Response.json(stats, { headers: NO_STORE });
  } catch {
    return Response.json({ error: "stats_unavailable" }, { status: 502, headers: NO_STORE });
  }
}
