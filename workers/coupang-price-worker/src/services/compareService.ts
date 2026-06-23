import { listProducts } from '../db/productsRepo';
import { prevDateString } from '../utils/dateKst';

async function latestSnapshotMapByDate(db: D1Database, baseDate: string) {
  const query = `
    SELECT
      s.id,
      s.product_id,
      s.url,
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
  `;

  const result = await db.prepare(query).bind(baseDate).all();
  const map = new Map<number, any>();

  for (const row of result.results ?? []) {
    map.set(Number((row as any).product_id), row);
  }

  return map;
}

export async function compareByDate(
  db: D1Database,
  compareDate: string,
  baseTime: string,
  timezone: string
) {
  const prevDate = prevDateString(compareDate);
  const products = await listProducts(db);

  const prevMap = await latestSnapshotMapByDate(db, prevDate);
  const todayMap = await latestSnapshotMapByDate(db, compareDate);

  const items = products.map(p => {
    const prev = prevMap.get(p.id);
    const today = todayMap.get(p.id);

    if (!prev) {
      return {
        productId: p.id,
        url: p.url,
        memo: p.memo,
        status: 'NO_PREV',
        changeMark: '-',
        prevPrice: null,
        todayPrice: today?.price ?? null
      };
    }

    if (!today) {
      return {
        productId: p.id,
        url: p.url,
        memo: p.memo,
        status: 'NO_TODAY',
        changeMark: '-',
        prevPrice: prev?.price ?? null,
        todayPrice: null
      };
    }

    if (today.status === 'FAILED') {
      return {
        productId: p.id,
        url: p.url,
        memo: p.memo,
        status: 'FAILED',
        changeMark: '-',
        prevPrice: prev.price,
        todayPrice: null,
        errorMessage: today.error_message
      };
    }

    const prevPrice = Number(prev.price);
    const todayPrice = Number(today.price);
    const changed = prevPrice !== todayPrice;

    return {
      productId: p.id,
      url: p.url,
      memo: p.memo,
      productName: today.product_name || prev.product_name || p.memo,
      seller: today.seller || prev.seller,
      prevCollectedAt: prev.collected_at,
      todayCollectedAt: today.collected_at,
      prevPrice,
      todayPrice,
      changed,
      changeMark: changed ? 'O' : 'X',
      status: 'SUCCESS'
    };
  });

  return {
    compareDate,
    prevDate,
    timezone,
    baseTime,
    items
  };
}
