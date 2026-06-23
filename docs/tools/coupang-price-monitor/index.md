# Product Price Monitor

상품 URL을 등록하고, 지정 기준 날짜·시간에 가격 정보를 수집해  
전일/당일 변동 여부를 확인하는 내부 운영 도구입니다.

::: warning PoC 기준
현재 v1은 무신사·올리브영 가격 수집을 우선 지원합니다.  
네이버 스마트스토어·브랜드스토어는 Worker fetch 단계에서 429 제한이 발생하여  
자동 수집 대신 `NAVER_FETCH_BLOCKED_429` 상태로 표시합니다.
:::

<CoupangPriceMonitor />

## Quick Links

- [Planning](./planning.md)
- [API](./api.md)
- [Deployment](./deployment.md)
- [Operation](./operation.md)
