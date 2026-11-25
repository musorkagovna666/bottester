# PC agent (Dolphin Anty)

Run this **on the Windows/Mac PC where Dolphin Anty is open**. The cloud dashboard only queues jobs.

```bash
cd pc-agent
# or from the app root:
# npm run agent
```

Set environment variables (do not commit them):

| Variable | Meaning |
| --- | --- |
| `DASHBOARD_URL` | Origin of the published app, no trailing slash |
| `PC_AGENT_TOKEN` | Same token as the dashboard secret |
| `DOLPHIN_HOST` | Default `127.0.0.1` |
| `DOLPHIN_PORT` | Default `3001` (see Dolphin Health window) |
| `DOLPHIN_TOKEN` | Dolphin “login with token” |
| `DOLPHIN_PROFILE_ID` | Profile to start with `automation=1` |

Optional: after a launch, POST Facebook cabinet numbers the agent read from the UI (not Ads API):

```bash
curl -X POST "$DASHBOARD_URL/api/stats/facebook" \
  -H "Authorization: Bearer $PC_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"leads":10,"spend":120.5,"jobId":"..."}'
```

The stub logs into Dolphin local API and starts/stops the profile. It does **not** click through Ads Manager yet.
