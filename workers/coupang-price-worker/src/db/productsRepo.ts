import { normalizeUrl } from '../utils/normalizeUrl';
import { nowIso } from '../utils/dateKst';

export interface Product {
  id: number;
  url: string;
  memo: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export async function listProducts(db: D1Database): Promise<Product[]> {
  const res = await db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY id DESC').all<Product>();
  return res.results || [];
}

export async function upsertProduct(db: D1Database, url: string, memo?: string): Promise<void> {
  const nurl = normalizeUrl(url);
  const now = nowIso();
  await db.prepare(`
    INSERT INTO products(url, memo, is_active, created_at, updated_at)
    VALUES (?, ?, 1, ?, ?)
    ON CONFLICT(url) DO UPDATE SET memo = excluded.memo, is_active = 1, updated_at = excluded.updated_at
  `).bind(nurl, memo || null, now, now).run();
}

export async function updateProduct(db: D1Database, id: number, memo: string | null, isActive: number): Promise<void> {
  await db.prepare('UPDATE products SET memo = ?, is_active = ?, updated_at = ? WHERE id = ?')
    .bind(memo, isActive, nowIso(), id).run();
}

export async function deactivateProduct(db: D1Database, id: number): Promise<void> {
  await db.prepare('UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?')
    .bind(nowIso(), id).run();
}
