import { listProducts } from '../db/productsRepo'
import { createRun, finishRun } from '../db/runsRepo'
import { insertSnapshot } from '../db/snapshotsRepo'
import { crawlProduct } from '../crawler/crawlProduct'
import { kstDateString } from '../utils/dateKst'
import type { CrawlResult } from '../crawler/crawlerTypes'

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'UNKNOWN_CRAWL_ERROR'
}

export async function runCrawl(db: D1Database, opts: {
  runType: 'MANUAL' | 'SCHEDULED'
  baseDate?: string
  baseTime: string
  timezone: string
}) {
  const products = await listProducts(db)
  const baseDate = opts.baseDate || kstDateString()

  const runId = await createRun(
    db,
    opts.runType,
    baseDate,
    opts.baseTime,
    opts.timezone,
    products.length
  )

  let success = 0
  let failed = 0

  for (const p of products) {
    let result: CrawlResult

    try {
      result = await crawlProduct(p.url)
    } catch (err) {
      result = {
        status: 'FAILED',
        price: null,
        errorMessage: getErrorMessage(err)
      }
    }

    try {
      await insertSnapshot(
        db,
        p.id,
        p.url,
        baseDate,
        opts.baseTime,
        opts.timezone,
        result
      )

      if (result.status === 'SUCCESS') {
        success++
      } else {
        failed++
      }
    } catch (err) {
      failed++

      await insertSnapshot(
        db,
        p.id,
        p.url,
        baseDate,
        opts.baseTime,
        opts.timezone,
        {
          status: 'FAILED',
          price: null,
          errorMessage: `SNAPSHOT_INSERT_FAILED: ${getErrorMessage(err)}`
        }
      )
    }
  }

  await finishRun(db, runId, success, failed)

  return {
    runId,
    total: products.length,
    success,
    failed,
    baseDate,
    baseTime: opts.baseTime,
    timezone: opts.timezone
  }
}
