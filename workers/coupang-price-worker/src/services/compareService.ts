import { latestSnapshotMap } from '../db/snapshotsRepo';
import { listProducts } from '../db/productsRepo';
import { prevDateString } from '../utils/dateKst';
import { diffRate } from '../utils/price';

export async function compareByDate(db: D1Database, compareDate: string, baseTime: string, timezone: string) {
  const prevDate = prevDateString(compareDate);
  const products = await listProducts(db);
  const prevMap = await latestSnapshotMap(db, prevDate, baseTime);
  const todayMap = await latestSnapshotMap(db, compareDate, baseTime);

  const items = products.map(p => {
    const prev = prevMap.get(p.id) as any;
    const today = todayMap.get(p.id) as any;

    if (!prev) return { productId: p.id, url: p.url, status: 'NO_PREV', changeMark: '-', prevPrice: null, todayPrice: today?.price ?? null };
    if (!today) return { productId: p.id, url: p.url, status: 'NO_TODAY', changeMark: '-', prevPrice: prev?.price ?? null, todayPrice: null };
    if (today.status === 'FAILED') return { productId: p.id, url: p.url, status: 'FAILED', changeMark: '-', prevPrice: prev.price, todayPrice: null, errorMessage: today.error_message };

    const prevPrice = Number(prev.price);
    const todayPrice = Number(today.price);
    const diff = todayPrice - prevPrice;
    const status = diff > 0 ? 'UP' : diff < 0 ? 'DOWN' : 'SAME';

    return {
      productId: p.id,
      url: p.url,
      productName: today.product_name || prev.product_name,
      seller: today.seller || prev.seller,
      prevCollectedAt: prev.collected_at,
      todayCollectedAt: today.collected_at,
      prevPrice,
      todayPrice,
      changed: diff !== 0,
      changeMark: diff !== 0 ? 'O' : 'X',
      diff,
      diffRate: diffRate(prevPrice, todayPrice),
      status
    };
  });

  return { compareDate, prevDate, timezone, baseTime, items };
}
