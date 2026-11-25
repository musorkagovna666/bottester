import { randomUUID } from "node:crypto";
import { sql } from "./db";
import type { FacebookSnapshot, Job, LaunchPayload } from "./types";

type JobRow = {
  id: string;
  status: Job["status"];
  payload: string;
  result: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

function mapJob(row: JobRow): Job {
  return {
    id: row.id,
    status: row.status,
    payload: JSON.parse(row.payload) as LaunchPayload,
    result: row.result ? JSON.parse(row.result) : null,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function enqueueJob(payload: LaunchPayload): Promise<Job> {
  const id = randomUUID();
  const rows = await sql<JobRow>(
    `INSERT INTO jobs (id, status, payload)
     VALUES ($1, 'queued', $2)
     RETURNING id, status, payload, result, error, created_at, updated_at`,
    [id, JSON.stringify(payload)],
  );
  return mapJob(rows[0]);
}

export async function listJobs(): Promise<Job[]> {
  const rows = await sql<JobRow>(
    `SELECT id, status, payload, result, error, created_at, updated_at
     FROM jobs ORDER BY created_at DESC LIMIT 50`,
  );
  return rows.map(mapJob);
}

export async function nextQueuedJob(): Promise<Job | null> {
  const rows = await sql<JobRow>(
    `SELECT id, status, payload, result, error, created_at, updated_at
     FROM jobs WHERE status = 'queued'
     ORDER BY created_at ASC LIMIT 1`,
  );
  return rows[0] ? mapJob(rows[0]) : null;
}

export async function updateJob(
  id: string,
  patch: { status?: Job["status"]; result?: unknown; error?: string | null },
): Promise<Job | null> {
  const existing = await sql<JobRow>(
    `SELECT id, status, payload, result, error, created_at, updated_at FROM jobs WHERE id = $1`,
    [id],
  );
  if (!existing[0]) return null;
  const status = patch.status ?? existing[0].status;
  const result =
    patch.result !== undefined ? JSON.stringify(patch.result) : existing[0].result;
  const error = patch.error !== undefined ? patch.error : existing[0].error;
  const rows = await sql<JobRow>(
    `UPDATE jobs SET status = $2, result = $3, error = $4, updated_at = NOW()
     WHERE id = $1
     RETURNING id, status, payload, result, error, created_at, updated_at`,
    [id, status, result, error],
  );
  return mapJob(rows[0]);
}

export async function addFacebookSnapshot(input: {
  jobId?: string | null;
  leads: number;
  spend: number;
  note?: string | null;
}): Promise<FacebookSnapshot> {
  const id = randomUUID();
  const rows = await sql<{
    id: string;
    job_id: string | null;
    leads: string;
    spend: string;
    note: string | null;
    created_at: string;
  }>(
    `INSERT INTO facebook_snapshots (id, job_id, leads, spend, note)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, job_id, leads, spend, note, created_at`,
    [id, input.jobId ?? null, input.leads, input.spend, input.note ?? null],
  );
  const row = rows[0];
  return {
    id: row.id,
    jobId: row.job_id,
    leads: Number(row.leads),
    spend: Number(row.spend),
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function latestFacebookSnapshot(): Promise<FacebookSnapshot | null> {
  const rows = await sql<{
    id: string;
    job_id: string | null;
    leads: string;
    spend: string;
    note: string | null;
    created_at: string;
  }>(
    `SELECT id, job_id, leads, spend, note, created_at
     FROM facebook_snapshots ORDER BY created_at DESC LIMIT 1`,
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    id: row.id,
    jobId: row.job_id,
    leads: Number(row.leads),
    spend: Number(row.spend),
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function getMeta(key: string): Promise<string | null> {
  const rows = await sql<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = $1`,
    [key],
  );
  return rows[0]?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await sql(
    `INSERT INTO app_meta (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value],
  );
}
