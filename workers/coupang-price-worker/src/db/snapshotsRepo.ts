import { nowIso } from '../utils/dateKst'
import type { CrawlResult } from '../crawler/crawlerTypes'

export async function insertSnapshot(
  db: D1Database,
  productId: number,
  url: string,
  baseDate: string,
  baseTime: string,
  timezone: string,
  result: CrawlResult
): Promise<void> {
  const now = nowIso()

  await db.prepare(`
    INSERT INTO crawl_snapshots(
      product_id, url, product_name, seller, price, currency,
      collected_at, base_date, base_time, timezone, status, error_message, raw_hash, created_at
    ) VALUES (?, ?, ?, ?, ?, 'KRW', ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    productId,
    url,
    result.productName || null,
    result.seller || null,
    result.price ?? null,
    now,
    baseDate,
    baseTime,
    timezone,
    result.status,
    result.errorMessage || null,
    result.rawHash || null,
    now
  ).run()
}

export async function listSnapshotsByDate(db: D1Database, baseDate: string) {
  const res = await db.prepare(
    'SELECT * FROM crawl_snapshots WHERE base_date = ? ORDER BY product_id ASC, id DESC'
  ).bind(baseDate).all()

  return res.results || []
}

export async function latestSnapshotMap(db: D1Database, baseDate: string, baseTime: string) {
  const res = await db.prepare(`
    SELECT s.* FROM crawl_snapshots s
    JOIN (
      SELECT product_id, MAX(id) AS max_id
      FROM crawl_snapshots
      WHERE base_date = ? AND base_time = ?
      GROUP BY product_id
    ) x ON s.id = x.max_id
  `).bind(baseDate, baseTime).all<any>()

  return new Map((res.results || []).map(r => [r.product_id, r]))
}
