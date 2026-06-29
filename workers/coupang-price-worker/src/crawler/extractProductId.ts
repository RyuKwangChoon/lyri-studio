import type { Market } from './detectMarket'

export function extractProductId(url: string, market?: Market): string | null {
  try {
    const u = new URL(url)

    if (market === 'OLIVEYOUNG') {
      return u.searchParams.get('goodsNo')
    }

    const match = u.pathname.match(/\/products\/(\d+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
