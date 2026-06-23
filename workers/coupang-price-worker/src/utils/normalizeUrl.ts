export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    // 추적 파라미터 제거. 필요한 식별 파라미터는 PoC 후 조정.
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => u.searchParams.delete(k));
    return u.toString();
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}
