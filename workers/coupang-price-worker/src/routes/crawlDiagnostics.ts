import type { AppContext } from '../env'
import { getSchedule } from '../db/settingsRepo'
import { getCrawlDiagnostics } from '../services/crawlDiagnosticsService'
import { kstDateString } from '../utils/dateKst'
import { json } from '../utils/response'

function parseNumberParam(value: string | null): number | undefined {
  if (!value) return undefined

  const parsed = Number(value)
  if (Number.isNaN(parsed)) return undefined

  return parsed
}

export async function crawlDiagnosticsRoute(ctx: AppContext): Promise<Response> {
  const url = new URL(ctx.request.url)

//   const setting = await getSchedule(ctx.env.DB)

//   const baseDate = url.searchParams.get('baseDate') || url.searchParams.get('date') || kstDateString()
//   const baseTime = url.searchParams.get('baseTime') || setting.baseTime
    const baseDate =
    url.searchParams.get('baseDate') ||
    url.searchParams.get('date') ||
    kstDateString()

    const baseTimeParam =
    url.searchParams.get('baseTime') ||
    url.searchParams.get('time')

    let baseTime = baseTimeParam

    if (!baseTime) {
    const setting = await getSchedule(ctx.env.DB)
    baseTime = setting.baseTime
    }
  const data = await getCrawlDiagnostics(ctx.env.DB, {
    baseDate,
    baseTime,
    market: url.searchParams.get('market'),
    status: url.searchParams.get('status'),
    keyword: url.searchParams.get('keyword'),
    errorMessage: url.searchParams.get('errorMessage'),
    limit: parseNumberParam(url.searchParams.get('limit')),
    offset: parseNumberParam(url.searchParams.get('offset'))
  })

  return json({ ok: true, ...data }, {}, ctx.env)
}
