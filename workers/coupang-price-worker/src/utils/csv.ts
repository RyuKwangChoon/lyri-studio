export interface ProductCsvRow {
  url: string;
  memo?: string;
}

export function parseProductCsv(csv: string): ProductCsvRow[] {
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines.shift()!.split(',').map(h => h.trim());
  const urlIdx = header.indexOf('url');
  const memoIdx = header.indexOf('memo');
  if (urlIdx < 0) throw new Error('CSV header must include url');
  return lines.map(line => {
    const cols = splitCsvLine(line);
    return {
      url: cols[urlIdx]?.trim() || '',
      memo: memoIdx >= 0 ? cols[memoIdx]?.trim() : undefined
    };
  }).filter(r => r.url);
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === ',' && !quoted) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}
