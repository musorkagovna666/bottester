"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type AdGroup = { name: string; creativePath: string; destinationUrl: string };
type Job = {
  id: string;
  status: string;
  payload: { offer: string; geo: string; adGroups: AdGroup[] };
  error: string | null;
  createdAt: string;
};
type Stats = {
  limonad: { leads: number; confirmed: number; revenue: number; sample: boolean };
  facebook: { leads: number; spend: number; note: string | null; at: string | null };
  revenue: number;
  spend: number;
  leads: number;
  roi: number | null;
  cpa: number | null;
  sample: boolean;
};

const emptyGroup = (): AdGroup => ({
  name: "Ad group 1",
  creativePath: "",
  destinationUrl: "https://",
});

export function Dashboard({
  viewer,
}: {
  viewer: { name: string; simulated: boolean };
}) {
  const [tab, setTab] = useState<"launch" | "stats">("launch");
  const [offer, setOffer] = useState("");
  const [offerId, setOfferId] = useState("");
  const [geo, setGeo] = useState("US");
  const [ageMin, setAgeMin] = useState(25);
  const [ageMax, setAgeMax] = useState(55);
  const [dailyBudget, setDailyBudget] = useState(50);
  const [creativesLocation, setCreativesLocation] = useState("");
  const [adGroups, setAdGroups] = useState<AdGroup[]>([emptyGroup()]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [offers, setOffers] = useState<{ id: string; name: string; sample: boolean }[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fbLeads, setFbLeads] = useState("");
  const [fbSpend, setFbSpend] = useState("");

  const loadJobs = useCallback(async () => {
    const res = await fetch("/api/launch", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { jobs: Job[] };
    setJobs(data.jobs);
  }, []);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/stats", { cache: "no-store" });
    if (!res.ok) return;
    setStats((await res.json()) as Stats);
  }, []);

  useEffect(() => {
    void loadJobs();
    void fetch("/api/offers", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.offers) setOffers(d.offers);
      });
  }, [loadJobs]);

  useEffect(() => {
    if (tab === "stats") void loadStats();
  }, [tab, loadStats]);

  const structure = useMemo(
    () => `1 campaign · 1 ad set · ${adGroups.length} ad group${adGroups.length === 1 ? "" : "s"}`,
    [adGroups.length],
  );

  async function launch() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/launch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        offer,
        offerId: offerId || undefined,
        geo,
        ageMin,
        ageMax,
        dailyBudget,
        creativesLocation,
        adGroups,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(String(data.error ?? "launch_failed"));
      return;
    }
    setMessage(`Queued ${data.job.id}. PC agent next to Dolphin will pick it up.`);
    await loadJobs();
  }

  async function saveFb() {
    const res = await fetch("/api/stats/facebook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leads: Number(fbLeads), spend: Number(fbSpend) }),
    });
    if (res.ok) {
      setFbLeads("");
      setFbSpend("");
      await loadStats();
    }
  }

  return (
    <main className="wrap">
      <p className="kicker">kodaoslab.com/fbmataavto</p>
      <h1>FB Mata Avto</h1>
      <p className="lede">
        Autozaliv for Akimova Pride. One campaign, one ad set, N ad groups. Launch queues a job
        for the PC Dolphin agent — this cloud app does not drive Ads Manager.
      </p>
      <p className="hint">
        Viewer: {viewer.name}
        {viewer.simulated ? " (simulated locally; published app uses Cursor sign-in)" : ""}
      </p>

      <div className="tabs">
        <button className={tab === "launch" ? "active" : ""} onClick={() => setTab("launch")}>
          Launch
        </button>
        <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}>
          Stats
        </button>
      </div>

      {tab === "launch" ? (
        <section className="grid">
          <p className="hint">{structure}</p>
          <div className="grid two">
            <label>
              Offer
              <input
                list="offers"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder="Limonad offer name"
              />
              <datalist id="offers">
                {offers.map((o) => (
                  <option key={o.id} value={o.name} />
                ))}
              </datalist>
            </label>
            <label>
              Offer ID (optional UUID)
              <input value={offerId} onChange={(e) => setOfferId(e.target.value)} />
            </label>
            <label>
              Geo
              <input value={geo} onChange={(e) => setGeo(e.target.value)} />
            </label>
            <label>
              Daily budget
              <input
                type="number"
                min={1}
                value={dailyBudget}
                onChange={(e) => setDailyBudget(Number(e.target.value))}
              />
            </label>
            <label>
              Age min
              <input
                type="number"
                min={18}
                max={65}
                value={ageMin}
                onChange={(e) => setAgeMin(Number(e.target.value))}
              />
            </label>
            <label>
              Age max
              <input
                type="number"
                min={18}
                max={65}
                value={ageMax}
                onChange={(e) => setAgeMax(Number(e.target.value))}
              />
            </label>
          </div>
          <label>
            Creatives location (folder on the PC)
            <input
              value={creativesLocation}
              onChange={(e) => setCreativesLocation(e.target.value)}
              placeholder="C:\\ads\\creatives"
            />
          </label>

          {adGroups.map((g, i) => (
            <div className="group" key={i}>
              <strong>Ad group {i + 1}</strong>
              <label>
                Name
                <input
                  value={g.name}
                  onChange={(e) => {
                    const next = [...adGroups];
                    next[i] = { ...g, name: e.target.value };
                    setAdGroups(next);
                  }}
                />
              </label>
              <label>
                Creative path
                <input
                  value={g.creativePath}
                  onChange={(e) => {
                    const next = [...adGroups];
                    next[i] = { ...g, creativePath: e.target.value };
                    setAdGroups(next);
                  }}
                />
              </label>
              <label>
                Destination URL
                <input
                  value={g.destinationUrl}
                  onChange={(e) => {
                    const next = [...adGroups];
                    next[i] = { ...g, destinationUrl: e.target.value };
                    setAdGroups(next);
                  }}
                />
              </label>
              {adGroups.length > 1 ? (
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setAdGroups(adGroups.filter((_, j) => j !== i))}
                >
                  Remove group
                </button>
              ) : null}
            </div>
          ))}

          <div className="row">
            <button
              className="btn ghost"
              type="button"
              onClick={() =>
                setAdGroups([
                  ...adGroups,
                  { ...emptyGroup(), name: `Ad group ${adGroups.length + 1}` },
                ])
              }
            >
              Add ad group
            </button>
            <button className="btn" type="button" disabled={busy} onClick={() => void launch()}>
              Launch
            </button>
          </div>
          {message ? <p className={message.startsWith("Queued") ? "ok" : "err"}>{message}</p> : null}

          <h2>Queue</h2>
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Offer</th>
                <th>Groups</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="mono">{job.createdAt}</td>
                  <td>{job.payload.offer}</td>
                  <td>{job.payload.adGroups.length}</td>
                  <td>{job.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="grid">
          {stats?.sample ? (
            <p className="hint sample">
              Sample Limonad numbers — bind LIMONAD_API_KEY on the published app. Facebook spend
              comes from the PC agent / this form, not the Ads API.
            </p>
          ) : null}
          <div className="cards">
            <div className="card">
              <div className="hint">Leads (Limonad)</div>
              <div className="n">{stats?.limonad.leads ?? "—"}</div>
            </div>
            <div className="card">
              <div className="hint">Spend (FB stored)</div>
              <div className="n">{stats ? stats.spend.toFixed(2) : "—"}</div>
            </div>
            <div className="card">
              <div className="hint">Revenue</div>
              <div className="n">{stats ? stats.revenue.toFixed(2) : "—"}</div>
            </div>
            <div className="card">
              <div className="hint">ROI</div>
              <div className="n">
                {stats?.roi == null ? "—" : `${(stats.roi * 100).toFixed(1)}%`}
              </div>
            </div>
            <div className="card">
              <div className="hint">CPA</div>
              <div className="n">{stats?.cpa == null ? "—" : stats.cpa.toFixed(2)}</div>
            </div>
          </div>
          <p className="hint">
            FB stored leads {stats?.facebook.leads ?? 0} vs Limonad confirmed{" "}
            {stats?.limonad.confirmed ?? 0}. Telegram /stats and a 12h digest use the same
            numbers.
          </p>
          <div className="grid two">
            <label>
              Store FB leads
              <input value={fbLeads} onChange={(e) => setFbLeads(e.target.value)} />
            </label>
            <label>
              Store FB spend
              <input value={fbSpend} onChange={(e) => setFbSpend(e.target.value)} />
            </label>
          </div>
          <button className="btn ghost" type="button" onClick={() => void saveFb()}>
            Save FB snapshot
          </button>
        </section>
      )}
    </main>
  );
}
