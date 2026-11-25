import { timingSafeEqual } from "node:crypto";
import { NO_STORE } from "@/lib/auth";
import { handleTelegramUpdate } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? "";
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
    const a = Buffer.from(header);
    const b = Buffer.from(secret);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
    }
  } else if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    return Response.json({ error: "telegram_unset" }, { status: 503, headers: NO_STORE });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400, headers: NO_STORE });
  }
  await handleTelegramUpdate(body as Parameters<typeof handleTelegramUpdate>[0]);
  return Response.json({ ok: true }, { headers: NO_STORE });
}
