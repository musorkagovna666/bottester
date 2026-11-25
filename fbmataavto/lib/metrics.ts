import { latestFacebookSnapshot } from "./jobs";
import { fetchLimonadStats, type LimonadStats } from "./limonad";

export type ReconciledStats = {
  limonad: LimonadStats;
  facebook: { leads: number; spend: number; note: string | null; at: string | null };
  revenue: number;
  spend: number;
  leads: number;
  roi: number | null;
  cpa: number | null;
  sample: boolean;
};

export async function reconciledStats(): Promise<ReconciledStats> {
  const limonad = await fetchLimonadStats();
  const fb = await latestFacebookSnapshot();
  const spend = fb?.spend ?? 0;
  const revenue = limonad.revenue;
  const leads = limonad.confirmed || limonad.leads;
  const roi = spend > 0 ? (revenue - spend) / spend : null;
  const cpa = leads > 0 && spend > 0 ? spend / leads : null;
  return {
    limonad,
    facebook: {
      leads: fb?.leads ?? 0,
      spend,
      note: fb?.note ?? null,
      at: fb?.createdAt ?? null,
    },
    revenue,
    spend,
    leads,
    roi,
    cpa,
    sample: limonad.sample,
  };
}

export function formatStatsMessage(stats: ReconciledStats): string {
  const roi = stats.roi == null ? "—" : `${(stats.roi * 100).toFixed(1)}%`;
  const cpa = stats.cpa == null ? "—" : stats.cpa.toFixed(2);
  const tag = stats.sample ? " (sample data — Limonad key unset)" : "";
  return [
    `FB Mata Avto stats${tag}`,
    `Leads (Limonad): ${stats.limonad.leads} / confirmed ${stats.limonad.confirmed}`,
    `Leads (FB stored): ${stats.facebook.leads}`,
    `Spend (FB stored): ${stats.spend.toFixed(2)}`,
    `Revenue (Limonad): ${stats.revenue.toFixed(2)}`,
    `ROI: ${roi}`,
    `CPA: ${cpa}`,
  ].join("\n");
}
