import { listProducts } from '../db/productsRepo'
import { latestSnapshotMap } from '../db/snapshotsRepo'

export type CrawlDiagnosticsDisplayStatus =
  | 'NORMAL'
  | 'FAILED'
  | 'PENDING'
  | 'MISSING_PRICE'

export interface CrawlDiagnosticsQuery {
  baseDate: string
  baseTime: string
  market?: string | null
  status?: string | null
  keyword?: string | null
  errorMessage?: string | null
  limit?: number
  offset?: number
}

export interface CrawlDiagnosticsItem {
  productId: number
  snapshotId: number | null
  url: string
  memo: string | null
  market: string
  productName: string | null
  seller: string | null
  price: number | null
  status: string | null
  displayStatus: CrawlDiagnosticsDisplayStatus
  errorMessage: string | null
  rawHash: string | null
  baseDate: string
  baseTime: string
  collectedAt: string | null
  createdAt: string | null
}

export interface CrawlDiagnosticsSummary {
  total: number
  normal: number
  failed: number
  pending: number
  missingPrice: number
}

export interface CrawlDiagnosticsResult {
  baseDate: string
  baseTime: string
  summary: CrawlDiagnosticsSummary
  items: CrawlDiagnosticsItem[]
}

function detectMarket(url: string): string {
  const lower = url.toLowerCase()

  if (lower.includes('musinsa.com')) return 'MUSINSA'
  if (lower.includes('oliveyoung.co.kr')) return 'OLIVEYOUNG'
  if (lower.includes('brand.naver.com')) return 'NAVER_BRANDSTORE'
  if (lower.includes('smartstore.naver.com')) return 'NAVER_SMARTSTORE'

  return 'UNKNOWN'
}

function getDisplayStatus(snapshot: any): CrawlDiagnosticsDisplayStatus {
  if (!snapshot) return 'PENDING'

  if (snapshot.status === 'FAILED') return 'FAILED'

  if (snapshot.status === 'SUCCESS' && snapshot.price == null) {
    return 'MISSING_PRICE'
  }

  return 'NORMAL'
}

function normalizeLimit(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 100
  return Math.min(Math.max(value, 1), 500)
}

function normalizeOffset(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 0
  return Math.max(value, 0)
}

function includesKeyword(item: CrawlDiagnosticsItem, keyword: string): boolean {
  const q = keyword.trim().toLowerCase()
  if (!q) return true

  return [
    item.url,
    item.memo,
    item.productName,
    item.seller,
    item.errorMessage,
    item.market
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q))
}

function createSummary(items: CrawlDiagnosticsItem[]): CrawlDiagnosticsSummary {
  return items.reduce<CrawlDiagnosticsSummary>(
    (acc, item) => {
      acc.total += 1

      if (item.displayStatus === 'NORMAL') acc.normal += 1
      if (item.displayStatus === 'FAILED') acc.failed += 1
      if (item.displayStatus === 'PENDING') acc.pending += 1
      if (item.displayStatus === 'MISSING_PRICE') acc.missingPrice += 1

      return acc
    },
    {
      total: 0,
      normal: 0,
      failed: 0,
      pending: 0,
      missingPrice: 0
    }
  )
}

export async function getCrawlDiagnostics(
  db: D1Database,
  query: CrawlDiagnosticsQuery
): Promise<CrawlDiagnosticsResult> {
  const products = await listProducts(db)
  const snapshots = await latestSnapshotMap(db, query.baseDate, query.baseTime)

  const items: CrawlDiagnosticsItem[] = products.map((product) => {
    const snapshot = snapshots.get(product.id) as any | undefined
    const market = detectMarket(product.url)
    const displayStatus = getDisplayStatus(snapshot)

    return {
      productId: product.id,
      snapshotId: snapshot?.id ?? null,
      url: product.url,
      memo: product.memo,
      market,
      productName: snapshot?.product_name ?? null,
      seller: snapshot?.seller ?? null,
      price: snapshot?.price ?? null,
      status: snapshot?.status ?? null,
      displayStatus,
      errorMessage: snapshot?.error_message ?? null,
      rawHash: snapshot?.raw_hash ?? null,
      baseDate: snapshot?.base_date ?? query.baseDate,
      baseTime: snapshot?.base_time ?? query.baseTime,
      collectedAt: snapshot?.collected_at ?? null,
      createdAt: snapshot?.created_at ?? null
    }
  })

  const filtered = items.filter((item) => {
    if (query.market && query.market !== 'ALL' && item.market !== query.market) {
      return false
    }

    if (query.status && query.status !== 'ALL' && item.displayStatus !== query.status) {
      return false
    }

    if (query.keyword && !includesKeyword(item, query.keyword)) {
      return false
    }

    if (
      query.errorMessage &&
      !(item.errorMessage || '').toLowerCase().includes(query.errorMessage.toLowerCase())
    ) {
      return false
    }

    return true
  })

  const summary = createSummary(filtered)
  const limit = normalizeLimit(query.limit)
  const offset = normalizeOffset(query.offset)

  return {
    baseDate: query.baseDate,
    baseTime: query.baseTime,
    summary,
    items: filtered.slice(offset, offset + limit)
  }
}
