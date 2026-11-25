import { timingSafeEqual } from "node:crypto";
import { requireIdentity } from "../cursor/identity";

const NO_STORE = { "cache-control": "private, no-store" };

export async function requireViewer(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) {
    identity.headers.set("cache-control", "private, no-store");
    return identity;
  }
  return identity;
}

export function agentTokenOk(request: Request): boolean {
  const expected = process.env.PC_AGENT_TOKEN?.trim() ?? "";
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : header;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
}

export { NO_STORE };
