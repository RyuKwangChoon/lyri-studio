import { parseCoupangPage } from './parseCoupangPage'
import { parseMusinsaPage } from './parseMusinsaPage'
import { parseOliveYoungPage } from './parseOliveYoungPage'
import { detectMarket, isCrawlSupported } from './detectMarket'
import type { CrawlResult } from './crawlerTypes'

export async function crawlProduct(url: string): Promise<CrawlResult> {
  try {
    const market = detectMarket(url)

    // v1: 네이버 계열은 Worker fetch에서 429가 발생하므로 fetch 전에 차단
    if (market === 'NAVER_SMARTSTORE' || market === 'NAVER_BRANDSTORE') {
      return {
        status: 'FAILED',
        price: null,
        errorMessage: 'NAVER_FETCH_BLOCKED_429'
      }
    }

    // v1: 무신사/올리브영만 실수집 지원
    if (!isCrawlSupported(market)) {
      return {
        status: 'FAILED',
        price: null,
        errorMessage: 'UNSUPPORTED_MARKET'
      }
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 LyriStudioPriceMonitor/0.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    })

    if (!res.ok) {
      return {
        status: 'FAILED',
        price: null,
        errorMessage: `FETCH_FAILED_${res.status}`
      }
    }

    const html = await res.text()

    if (market === 'MUSINSA') {
      return parseMusinsaPage(html)
    }

    if (market === 'OLIVEYOUNG') {
      return parseOliveYoungPage(html)
    }

    return parseCoupangPage(html)
  } catch (error) {
    return {
      status: 'FAILED',
      price: null,
      errorMessage: error instanceof Error ? error.message : String(error)
    }
  }
}
