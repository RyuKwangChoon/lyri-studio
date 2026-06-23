CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  memo TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS crawl_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  product_name TEXT,
  seller TEXT,
  price INTEGER,
  currency TEXT NOT NULL DEFAULT 'KRW',
  collected_at TEXT NOT NULL,
  base_date TEXT NOT NULL,
  base_time TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
  status TEXT NOT NULL,
  error_message TEXT,
  raw_hash TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_product_date_time
ON crawl_snapshots(product_id, base_date, base_time);

CREATE TABLE IF NOT EXISTS crawl_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_type TEXT NOT NULL,
  base_date TEXT NOT NULL,
  base_time TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
  started_at TEXT NOT NULL,
  finished_at TEXT,
  total_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR REPLACE INTO settings (key, value, updated_at)
VALUES
('schedule.timezone', 'Asia/Seoul', datetime('now')),
('schedule.baseTime', '09:00', datetime('now')),
('schedule.enabled', 'true', datetime('now'));
