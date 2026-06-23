import { nowIso } from '../utils/dateKst';

export async function createRun(db: D1Database, runType: string, baseDate: string, baseTime: string, timezone: string, total: number): Promise<number> {
  const now = nowIso();
  const res = await db.prepare(`
    INSERT INTO crawl_runs(run_type, base_date, base_time, timezone, started_at, total_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(runType, baseDate, baseTime, timezone, now, total, now).run();
  return Number(res.meta.last_row_id);
}

export async function finishRun(db: D1Database, runId: number, success: number, failed: number): Promise<void> {
  await db.prepare('UPDATE crawl_runs SET finished_at = ?, success_count = ?, fail_count = ? WHERE id = ?')
    .bind(nowIso(), success, failed, runId).run();
}

export async function listRuns(db: D1Database, limit = 50) {
  const res = await db.prepare('SELECT * FROM crawl_runs ORDER BY id DESC LIMIT ?').bind(limit).all();
  return res.results || [];
}
