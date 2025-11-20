# 🚀 Lyri × Brian Studio — PWA 설치 마스터 플랜  
Homepage Build Log 기록용 (2025)

---

## 1. VitePress에 PWA 플러그인 설치

```bash
npm install vitepress-plugin-pwa --save-dev
```

설치 후 `docs/.vitepress/config.ts` 에 아래 코드 추가:

```ts
import { defineConfig } from 'vitepress'
import { pwa } from 'vitepress-plugin-pwa'

export default defineConfig({
  title: 'Lyri × Brian Studio',
  description: 'AI × Music × Overlay × Dev',

  // 🔥 PWA 설정
  vite: {
    plugins: [
      pwa({
        outDir: './docs/.vitepress/dist',
        manifest: {
          name: 'Lyri × Brian Studio',
          short_name: 'Lyri Studio',
          description: 'AI × Music × Overlay × Dev',
          theme_color: '#6bc48e',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/pwa/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ]
  }
})
```

---

## 2. PWA 아이콘 이미지 준비

PWA 아이콘을 아래 경로에 추가:

```
docs/
 └─ .vitepress/
     └─ public/
         └─ pwa/
            ├─ icon-192.png
            ├─ icon-512.png
            └─ splash.png (옵션)
```

---

## 3. Service Worker 설정

기본 자동 생성으로 충분하지만, 필요 시 캐시 전략 설정:

```ts
pwa({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,ico}']
  }
})
```

---

## 4. GitHub Actions — 배포

현재 deploy.yml은 dist 폴더를 그대로 gh-pages로 올리므로 수정 필요 없음.  
PWA 파일(SW, manifest 등)은 자동 포함됨.

---

## 5. 설치 테스트

### 📱 iOS
Safari → 공유 → 홈 화면에 추가 → 앱으로 설치됨.

### 🤖 Android
Chrome → 메뉴 → “앱 설치” → 원터치 설치.

---

## ✨ PWA 적용 후 기대 효과
- 오프라인 문서 보기  
- 모바일 앱 아이콘 생성  
- 전체화면 UI  
- 빠른 로딩  
- Overlay Docs / Academy / Homepage 자료를 앱으로 휴대 가능  

---

## 리리 메모 🥄  
PWA 적용은 “웹사이트 → 앱”으로 진화하는 지점.  
Lyri × Brian Studio의 완전한 독립 플랫폼화 첫걸음이다.
