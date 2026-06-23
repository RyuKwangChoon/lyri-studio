import type { AppContext } from '../env';
import { listSnapshotsByDate } from '../db/snapshotsRepo';
import { kstDateString } from '../utils/dateKst';
import { json } from '../utils/response';
import type { Env } from '../env';


export async function snapshotsRoute(ctx: AppContext): Promise<Response> {
  const url = new URL(ctx.request.url);
  const date = url.searchParams.get('date') || kstDateString();
  return json({ ok: true, date, items: await listSnapshotsByDate(ctx.env.DB, date) }, {}, ctx.env);
}


export async function handleSnapshotsLatest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');

  if (!date) {
    return json(
      { ok: false, error: 'MISSING_DATE' },
      { status: 400 },
      env
    );
  }

  const query = `
    SELECT
      s.id,
      s.product_id,
      s.url,
      p.memo,
      p.is_active,
      s.product_name,
      s.seller,
      s.price,
      s.currency,
      s.collected_at,
      s.base_date,
      s.base_time,
      s.timezone,
      s.status,
      s.error_message,
      s.raw_hash,
      s.created_at
    FROM crawl_snapshots s
    INNER JOIN (
      SELECT product_id, MAX(id) AS latest_id
      FROM crawl_snapshots
      WHERE base_date = ?
      GROUP BY product_id
    ) latest
      ON s.product_id = latest.product_id
     AND s.id = latest.latest_id
    LEFT JOIN products p
      ON p.id = s.product_id
    ORDER BY s.product_id ASC
  `;

  const result = await env.DB.prepare(query).bind(date).all();

  return json({
    ok: true,
    date,
    items: result.results ?? []
  }, {}, env);
}
