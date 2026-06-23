import { nowIso } from '../utils/dateKst';

export interface ScheduleSetting {
  timezone: string;
  baseTime: string;
  enabled: boolean;
}

export async function getSchedule(db: D1Database): Promise<ScheduleSetting> {
  const res = await db.prepare('SELECT key, value FROM settings WHERE key LIKE ?').bind('schedule.%').all<{ key: string; value: string }>();
  const map = Object.fromEntries((res.results || []).map(r => [r.key, r.value]));
  return {
    timezone: map['schedule.timezone'] || 'Asia/Seoul',
    baseTime: map['schedule.baseTime'] || '09:00',
    enabled: (map['schedule.enabled'] || 'true') === 'true'
  };
}

export async function setSchedule(db: D1Database, setting: ScheduleSetting): Promise<void> {
  const now = nowIso();
  const stmts = [
    db.prepare('INSERT OR REPLACE INTO settings(key,value,updated_at) VALUES(?,?,?)').bind('schedule.timezone', setting.timezone, now),
    db.prepare('INSERT OR REPLACE INTO settings(key,value,updated_at) VALUES(?,?,?)').bind('schedule.baseTime', setting.baseTime, now),
    db.prepare('INSERT OR REPLACE INTO settings(key,value,updated_at) VALUES(?,?,?)').bind('schedule.enabled', String(setting.enabled), now)
  ];
  await db.batch(stmts);
}
