import type { AdGroup, LaunchPayload } from "./types";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseLaunch(body: unknown): LaunchPayload | string {
  if (!body || typeof body !== "object") return "invalid_body";
  const b = body as Record<string, unknown>;
  const offer = String(b.offer ?? "").trim();
  const geo = String(b.geo ?? "").trim();
  const creativesLocation = String(b.creativesLocation ?? "").trim();
  const ageMin = Number(b.ageMin);
  const ageMax = Number(b.ageMax);
  const dailyBudget = Number(b.dailyBudget);
  const offerId = b.offerId ? String(b.offerId).trim() : undefined;
  const groups = Array.isArray(b.adGroups) ? b.adGroups : [];
  if (!offer) return "offer_required";
  if (!geo) return "geo_required";
  if (!creativesLocation) return "creatives_location_required";
  if (!Number.isFinite(ageMin) || !Number.isFinite(ageMax) || ageMin < 18 || ageMax > 65 || ageMin > ageMax) {
    return "age_invalid";
  }
  if (!Number.isFinite(dailyBudget) || dailyBudget <= 0 || dailyBudget > 100000) {
    return "budget_invalid";
  }
  if (groups.length < 1 || groups.length > 20) return "ad_groups_count";
  const adGroups: AdGroup[] = [];
  for (const raw of groups) {
    if (!raw || typeof raw !== "object") return "ad_group_invalid";
    const g = raw as Record<string, unknown>;
    const name = String(g.name ?? "").trim();
    const creativePath = String(g.creativePath ?? "").trim();
    const destinationUrl = String(g.destinationUrl ?? "").trim();
    if (!name || !creativePath || !destinationUrl) return "ad_group_fields";
    if (!isHttpUrl(destinationUrl)) return "destination_url_invalid";
    adGroups.push({ name, creativePath, destinationUrl });
  }
  return {
    offer,
    offerId,
    geo,
    ageMin,
    ageMax,
    dailyBudget,
    creativesLocation,
    adGroups,
  };
}
