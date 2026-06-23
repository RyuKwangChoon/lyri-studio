export function extractProductId(url: string): string | null {
  const match = url.match(/\/products\/(\d+)/);
  return match ? match[1] : null;
}
