const LIMONAD_BASE = "https://api.limonad.com";

export type LimonadLead = {
  id: string;
  status: string | null;
  reward?: { webmasterReward?: number };
  offer?: { name?: string };
  createdAt?: string;
};

export type LimonadStats = {
  source: "limonad" | "sample";
  leads: number;
  confirmed: number;
  revenue: number;
  sample: boolean;
};

const SAMPLE: LimonadStats = {
  source: "sample",
  leads: 18,
  confirmed: 11,
  revenue: 1320,
  sample: true,
};

export async function fetchLimonadStats(opts?: {
  dateStart?: string;
  dateEnd?: string;
  offerId?: string;
}): Promise<LimonadStats> {
  const key = process.env.LIMONAD_API_KEY?.trim() ?? "";
  if (!key) return SAMPLE;

  const params = new URLSearchParams();
  params.set("limit", "100");
  params.set("offset", "0");
  if (opts?.dateStart) params.set("filters[dateStart]", opts.dateStart);
  if (opts?.dateEnd) params.set("filters[dateEnd]", opts.dateEnd);
  if (opts?.offerId) params.set("filters[offer]", opts.offerId);

  let offset = 0;
  let count = 0;
  let confirmed = 0;
  let revenue = 0;
  const maxPages = 20;

  for (let page = 0; page < maxPages; page += 1) {
    params.set("offset", String(offset));
    const res = await fetch(`${LIMONAD_BASE}/public/v1/leads?${params.toString()}`, {
      headers: { "X-Token": key, accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Limonad request failed (${res.status})`);
    }
    const body = (await res.json()) as { items?: LimonadLead[]; count?: number };
    const items = body.items ?? [];
    count += items.length;
    for (const item of items) {
      const status = String(item.status ?? "").toLowerCase();
      if (status === "confirmed") confirmed += 1;
      revenue += Number(item.reward?.webmasterReward ?? 0);
    }
    if (items.length < 100) break;
    offset += items.length;
    if (typeof body.count === "number" && offset >= body.count) break;
  }

  return {
    source: "limonad",
    leads: count,
    confirmed,
    revenue,
    sample: false,
  };
}

export async function fetchLimonadOffers(): Promise<
  { id: string; name: string; sample: boolean }[]
> {
  const key = process.env.LIMONAD_API_KEY?.trim() ?? "";
  if (!key) {
    return [
      { id: "sample-wellness", name: "Sample wellness offer", sample: true },
      { id: "sample-finance", name: "Sample finance offer", sample: true },
    ];
  }
  const res = await fetch(`${LIMONAD_BASE}/public/v1/offers?limit=50&filters[isMine]=true`, {
    headers: { "X-Token": key, accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Limonad offers failed (${res.status})`);
  const body = (await res.json()) as {
    items?: { id: string; name: string }[];
  };
  return (body.items ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    sample: false,
  }));
}
