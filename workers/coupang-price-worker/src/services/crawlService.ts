import { listProducts } from '../db/productsRepo';
import { createRun, finishRun } from '../db/runsRepo';
import { insertSnapshot } from '../db/snapshotsRepo';
import { crawlProduct } from '../crawler/crawlProduct';
import { kstDateString } from '../utils/dateKst';

export async function runCrawl(db: D1Database, opts: {
  runType: 'MANUAL' | 'SCHEDULED';
  baseDate?: string;
  baseTime: string;
  timezone: string;
}) {
  const products = await listProducts(db);
  const baseDate = opts.baseDate || kstDateString();
  const runId = await createRun(db, opts.runType, baseDate, opts.baseTime, opts.timezone, products.length);
  let success = 0;
  let failed = 0;

  for (const p of products) {
    const result = await crawlProduct(p.url);
    await insertSnapshot(db, p.id, p.url, baseDate, opts.baseTime, opts.timezone, result);
    if (result.status === 'SUCCESS') success++;
    else failed++;
  }

  await finishRun(db, runId, success, failed);
  return { runId, total: products.length, success, failed, baseDate, baseTime: opts.baseTime, timezone: opts.timezone };
}
