import { getMeta, setMeta } from "./jobs";
import { formatStatsMessage, reconciledStats } from "./metrics";

const CHAT_DEFAULT = "1540072090";
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function chatId() {
  return process.env.TELEGRAM_CHAT_ID?.trim() || CHAT_DEFAULT;
}

function token() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
}

export async function sendTelegram(text: string): Promise<{ ok: boolean; reason?: string }> {
  const bot = token();
  if (!bot) return { ok: false, reason: "telegram_unset" };
  const res = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId(), text }),
  });
  if (!res.ok) return { ok: false, reason: `telegram_http_${res.status}` };
  return { ok: true };
}

export async function sendStatsNow(): Promise<{ ok: boolean; reason?: string }> {
  const stats = await reconciledStats();
  const result = await sendTelegram(formatStatsMessage(stats));
  if (result.ok) await setMeta("last_telegram_stats", String(Date.now()));
  return result;
}

export async function maybeSendScheduledStats(): Promise<{ sent: boolean; reason?: string }> {
  const last = Number((await getMeta("last_telegram_stats")) ?? "0");
  if (Date.now() - last < TWELVE_HOURS_MS) {
    return { sent: false, reason: "too_soon" };
  }
  const result = await sendStatsNow();
  return { sent: result.ok, reason: result.reason };
}

type TelegramUpdate = {
  update_id?: number;
  message?: { text?: string; chat?: { id?: number } };
};

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const text = (update.message?.text ?? "").trim();
  const fromChat = String(update.message?.chat?.id ?? "");
  if (fromChat && fromChat !== chatId()) return;
  if (text === "/stats" || text.startsWith("/stats@")) {
    await sendStatsNow();
  }
}

export async function pollTelegramOnce(): Promise<void> {
  const bot = token();
  if (!bot) return;
  const offset = Number((await getMeta("telegram_offset")) ?? "0");
  const res = await fetch(
    `https://api.telegram.org/bot${bot}/getUpdates?timeout=0&offset=${offset || ""}`,
  );
  if (!res.ok) return;
  const body = (await res.json()) as { result?: TelegramUpdate[] };
  const updates = body.result ?? [];
  let maxId = offset;
  for (const update of updates) {
    await handleTelegramUpdate(update);
    if (typeof update.update_id === "number") maxId = Math.max(maxId, update.update_id + 1);
  }
  if (maxId) await setMeta("telegram_offset", String(maxId));
  await maybeSendScheduledStats();
}
