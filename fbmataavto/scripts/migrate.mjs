import { readdir, readFile } from "node:fs/promises";
import pg from "pg";

const url = process.env.DATABASE_URL?.trim() ?? "";
if (!url) {
  console.log("No DATABASE_URL; skipping migrate (PGlite applies SQL at runtime).");
  process.exit(0);
}

const files = (await readdir("migrations").catch(() => []))
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  for (const file of files) {
    await client.query(await readFile(`migrations/${file}`, "utf8"));
    console.log("applied", file);
  }
} finally {
  await client.end();
}
