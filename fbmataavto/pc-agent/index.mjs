/**
 * PC agent — run on the USER machine next to Dolphin Anty (not on the cloud VM).
 *
 * Env:
 *   DASHBOARD_URL     published app origin, e.g. https://... (no trailing slash)
 *   PC_AGENT_TOKEN    same value as the dashboard secret
 *   DOLPHIN_HOST      default 127.0.0.1
 *   DOLPHIN_PORT      default 3001
 *   DOLPHIN_TOKEN     Dolphin local login-with-token
 *   DOLPHIN_PROFILE_ID  profile to start for Ads Manager work
 */
const dashboard = (process.env.DASHBOARD_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const agentToken = process.env.PC_AGENT_TOKEN ?? "";
const dolphinHost = process.env.DOLPHIN_HOST ?? "127.0.0.1";
const dolphinPort = process.env.DOLPHIN_PORT ?? "3001";
const dolphinToken = process.env.DOLPHIN_TOKEN ?? "";
const profileId = process.env.DOLPHIN_PROFILE_ID ?? "";

if (!agentToken) {
  console.error("PC_AGENT_TOKEN is required");
  process.exit(1);
}

const dolphinBase = `http://${dolphinHost}:${dolphinPort}`;

async function dashboardFetch(path, init = {}) {
  const headers = {
    authorization: `Bearer ${agentToken}`,
    accept: "application/json",
    ...(init.headers ?? {}),
  };
  return fetch(`${dashboard}${path}`, { ...init, headers });
}

async function dolphinLogin() {
  if (!dolphinToken) {
    console.warn("DOLPHIN_TOKEN unset — skipping local login");
    return;
  }
  const res = await fetch(`${dolphinBase}/v1.0/auth/login-with-token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: dolphinToken }),
  });
  if (!res.ok) throw new Error(`dolphin_login_${res.status}`);
}

async function startProfile() {
  if (!profileId) {
    console.warn("DOLPHIN_PROFILE_ID unset — stub will not start a browser");
    return null;
  }
  const res = await fetch(
    `${dolphinBase}/v1.0/browser_profiles/${encodeURIComponent(profileId)}/start?automation=1`,
  );
  if (!res.ok) throw new Error(`dolphin_start_${res.status}`);
  return res.json();
}

async function stopProfile() {
  if (!profileId) return;
  await fetch(`${dolphinBase}/v1.0/browser_profiles/${encodeURIComponent(profileId)}/stop`);
}

async function runJob(job) {
  await dolphinLogin();
  const started = await startProfile();
  const result = {
    stub: true,
    structure: {
      campaigns: 1,
      adsets: 1,
      adGroups: job.payload?.adGroups?.length ?? 0,
    },
    dolphin: started
      ? { started: true, automationPort: started.automation?.port ?? null }
      : { started: false },
    note: "Launcher stub: logged into Dolphin local API. Ads Manager clicks are not automated yet.",
  };
  await stopProfile();
  return result;
}

async function loop() {
  await dashboardFetch("/api/telegram/tick", { method: "POST" }).catch(() => null);
  const res = await dashboardFetch("/api/agent/jobs");
  if (res.status === 401) {
    console.error("Dashboard rejected PC_AGENT_TOKEN");
    return;
  }
  if (!res.ok) {
    console.warn("poll failed", res.status);
    return;
  }
  const { job } = await res.json();
  if (!job) return;
  console.log("picked job", job.id);
  try {
    const result = await runJob(job);
    await dashboardFetch(`/api/agent/jobs/${job.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "done", result }),
    });
    console.log("job done", job.id);
  } catch (err) {
    await dashboardFetch(`/api/agent/jobs/${job.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "error",
        error: err instanceof Error ? err.message : "agent_error",
      }),
    });
    console.error("job error", job.id);
  }
}

console.log("PC agent watching", dashboard, "dolphin", dolphinBase);
setInterval(() => {
  loop().catch((err) => console.error(err instanceof Error ? err.message : "loop_error"));
}, 8000);
void loop();
