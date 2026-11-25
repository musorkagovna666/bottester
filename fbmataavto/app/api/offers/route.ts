import { requireViewer, NO_STORE } from "@/lib/auth";
import { fetchLimonadOffers } from "@/lib/limonad";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireViewer(request);
  if (identity instanceof Response) return identity;
  try {
    const offers = await fetchLimonadOffers();
    return Response.json({ offers }, { headers: NO_STORE });
  } catch {
    return Response.json({ error: "offers_unavailable" }, { status: 502, headers: NO_STORE });
  }
}
