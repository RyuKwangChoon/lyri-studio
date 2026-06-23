# Coupang Price Worker

Lyri × Brian Studio의 Coupang Price Monitor용 Cloudflare Worker API입니다.

## 중요

- Worker 배포만으로 D1 DB가 자동 생성되지 않습니다.
- 먼저 `wrangler d1 create`로 D1 DB를 생성하고, `wrangler.toml`에 `database_id`를 반영해야 합니다.
- 이후 `wrangler d1 migrations apply --remote`로 테이블을 생성합니다.

## 실행 순서

```bash
npm install
npx wrangler d1 create lyri_price_monitor
# wrangler.toml database_id 교체
npx wrangler d1 migrations apply lyri_price_monitor --remote
npx wrangler deploy
```

## PoC

먼저 URL 1개만 등록한 뒤 `/crawl/run`을 실행해 가격 파싱 가능 여부를 확인합니다.
