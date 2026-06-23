import { getSchedule } from '../db/settingsRepo';
import { runCrawl } from './crawlService';

export async function runScheduled(db: D1Database) {
  const setting = await getSchedule(db);
  if (!setting.enabled) return { skipped: true, reason: 'schedule.disabled' };
  return await runCrawl(db, {
    runType: 'SCHEDULED',
    baseTime: setting.baseTime,
    timezone: setting.timezone
  });
}
