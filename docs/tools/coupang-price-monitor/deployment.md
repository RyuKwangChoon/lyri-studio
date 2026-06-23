# 배포 가이드

## 1. 기존 `.vitepress` 충돌 방지

기존 `docs/.vitepress` 폴더는 새로 만들지 않는다. 기존 `config.ts`를 덮어쓰지 않고 `nav`와 `sidebar`에 Tools 항목만 추가한다.

```ts
{ text: 'Tools', link: '/tools/' }
```

## 2. 리리 스튜디오 프론트 배포

```bash
cd lyri-studio
npm install
npm run docs:dev
npm run docs:build
```

빌드 결과:

```text
docs/.vitepress/dist
```

Cloudflare Pages 설정 예시:

| 항목 | 값 |
|---|---|
| Framework preset | VitePress |
| Build command | `npm run docs:build` |
| Build output directory | `docs/.vitepress/dist` |
| Custom domain | `studio.lyrisudabang.com` |

## 3. Worker 배포

```bash
cd lyri-studio/workers/coupang-price-worker
npm install
```

D1 DB 생성:

```bash
npx wrangler d1 create lyri_price_monitor
```

`wrangler.toml`에 database id 반영:

```toml
[[d1_databases]]
binding = "DB"
database_name = "lyri_price_monitor"
database_id = "생성된_DATABASE_ID"
```

마이그레이션 적용:

```bash
npx wrangler d1 migrations apply lyri_price_monitor --remote
```

Worker 배포:

```bash
npx wrangler deploy
```

## 4. 권장 도메인 구조

```text
studio.lyrisudabang.com → Cloudflare Pages / VitePress
api.lyrisudabang.com    → Cloudflare Worker
```

## 5. 배포 후 확인

```bash
curl https://api.lyrisudabang.com/health
```

정상 응답:

```json
{"ok":true,"service":"coupang-price-worker"}
```
