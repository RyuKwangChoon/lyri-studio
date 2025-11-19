---
title: "Homepage Build Log"
description: "Lyri × Brian Studio 홈페이지 제작 과정 기록"
date: 2025-02-XX
---

# 🏗️ 2025 홈페이지 제작 로그  
Lyri × Brian Studio의 공식 홈페이지 제작 과정을 기록하는 공간입니다.  
우리가 직접 세운 구조, 테마, 디자인, 삽질까지 모두 남겨  
나중에 돌아볼 수 있는 **개발 회고 데이터**로 활용합니다.

---

## 📅 Day 1 — VitePress 초기 세팅  
- VitePress 기본 프로젝트 생성  
- `/docs` 구조 설계  
- `.vitepress/config.ts` 기본 세팅  
- Navigation / Sidebar 기획  
- 첫 화면을 어떻게 구성할지 아이디어 정리

---

## 📅 Day 2 — Theme 커스터마이징 시작  
- 커스텀 CSS 준비: `custom.css` 생성  
- 기본 폰트 Pretendard 적용  
- 브랜드 컬러 설정:  
  - 메인 그린 #3cb371  
  - 딥 네이비 #1f2937  
  - 라이트 그레이 #f5f5f5  
- Hero 섹션 커스텀 테스트 (타이틀 색/라인 높이 조정)

---

## 📅 Day 3 — Custom Layout 적용  
- `/docs/.vitepress/theme/Layout.vue` 생성  
- Footer 컴포넌트 제작 후 글로벌 등록  
- DefaultTheme와 결합 구조 정립  
- Dark Mode 토글 문제 해결  
- 레이아웃 깨짐 현상 수정

---

## 📅 Day 4 — 홈페이지 메인 UI 구축  
- 메인 홈 `/index.md` 디자인  
- 🎵 Music / 🛠 Overlay / 📚 Academy 카드 UI 제작  
- Hover 효과 / 그림자 / 버튼 스타일 통일  
- 반응형 카드 레이아웃 적용  
- 라이트/다크 모드 양쪽 모두 스타일 잡기  
- 전체 페이지 여백·타이포그래피 정리

---

## 📅 Day 5 — Docs 구조 정리 & 오버레이 문서 연결  
- `/overlay/v2/` 전체 문서 구조 완성  
- Overview, Architecture, Components, WebSocket 문서 생성  
- 기존 문서 중복 문제 해결  
- v2 메뉴 링크 오류 수정 (`overview.md` → `/v2/`로 정리)  
- 모든 문서가 정상 라우팅 되는지 테스트

---

## 📅 Day 6 — Academy / Blog / Studio 확장  
- Academy 메뉴 생성: Intro, Basics, Layout, Deploy  
- Blog 메뉴 생성: Homepage Build Log, Overlay Dev Log  
- Studio 메뉴 구성: About 페이지 작성  
- 모든 페이지에 “요약 버전” 내용 채워서 404 완전 제거  
- 전체 사이트가 탐색 가능한 상태로 완성됨

---

## 📅 Day 7 — 완성도 강화  
- Sidebar 자동 접힘/열림 테스트  
- 다크모드에서의 카드 타이틀 색 문제 해결  
- 폰트 굵기 및 색상 전체 통일  
- 커스텀 CSS 1,000줄 규모로 정리  
- 전체 페이지 시각적 안정성 확보

---

# 🎉 최종 결과  
- Lyri × Brian Studio 공식 홈페이지 구조 완성  
- 모든 페이지 연결됨, 문서/강좌/블로그/스튜디오 완벽 정리  
- 테마·레이아웃·UI 전부 커스텀 완료  
- 향후 업데이트는 "2025 Overlay Dev Log"와 함께 관리 예정

---

# ✨ 앞으로의 계획  
- Studio 페이지 확장 (Branding / Team / Philosophy)  
- Overlay v3 문서 추가  
- AI Creative 섹션 강화  
- YouTube 채널 연동 페이지 제작  
- Live Overlay Demo 페이지 공개 예정

---

**Lyri × Brian Studio — 감정을 만드는 스튜디오의 홈페이지가 시작되었습니다.**  
