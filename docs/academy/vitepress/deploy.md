# Deploy Guide

문서를 배포하는 가장 단순한 방법을 정리한 페이지입니다.

## 내용 요약
- 빌드(`pnpm docs:build`)
- dist 폴더 설명
- GitHub Pages로 올리는 기본 흐름
- Cloudflare Pages 배포 개요

---
# 📘 VitePress GitHub Pages 배포 가이드 (lyri-studio 전용)
_최종 업데이트: 2025-11-20_

본 문서는 **lyri-studio** 저장소를 VitePress 기반 GitHub Pages로 배포하는 전체 절차를 정리한 가이드입니다.  
“배포 → 오류 해결 → 권한 수정 → UI 깨짐 해결 → 최종 정상 표시”까지 모든 과정을 포함합니다.

---

## 1. 🔧 GitHub Actions로 VitePress 배포 준비

### 생성 파일
```
.github/workflows/deploy.yml
```

### 기본 workflow

```yaml
name: Deploy VitePress Site
on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Build VitePress site
        run: npm run docs:build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          personal_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/.vitepress/dist
          publish_branch: gh-pages
```

---

## 2. ❗ 첫 번째 실패: Dead Link 검사 오류

### 에러 로그
```
[vitepress] One or more pages contain dead links.
Found: http://localhost:5173
```

### 원인  
문서 내 `http://localhost:5173` 등의 로컬 개발용 링크가 그대로 포함됨.

### 해결  
문제가 되는 md에서 해당 링크 **제거 또는 주석 처리**.

---

## 3. ❗ 두 번째 실패: GitHub Actions 권한 오류

### 에러 로그
```
remote: Permission denied to github-actions[bot]
fatal: unable to access https://github.com/...
```

### 원인  
`GITHUB_TOKEN` 권한이 **WRITE 권한 없음**.

### 해결

#### GitHub → Repository → Settings → Actions → General
1. **Workflow permissions**
   - ✔ Allow READ and WRITE permissions  
   - ✔ Allow GitHub Actions to create and approve pull requests  

이후 workflow 재실행 → 정상 배포됨.

---

## 4. 🚀 gh-pages 브랜치 생성 & 배포 완료

배포 성공 시:

- `gh-pages` 브랜치 자동 생성  
- 빌드 결과물 전체 HTML/CSS/JS 업로드  
- Pages 설정 화면에서 “배포됨” 표시

---

## 5. ❗ 사이트 UI 깨짐 (CSS 누락)

### 현상
- 텍스트만 표시됨  
- 스타일 전부 적용 안됨  
- 메뉴/레이아웃 붕괴  
- `/assets/*.css` 전부 404

### 원인 (중요)  
GitHub Pages 배포 주소:

```
https://ryukwangchoon.github.io/lyri-studio/
```

VitePress 기본 설정:

```
base: '/'
```

→ CSS 경로가 `/assets/...` 로 계산되어 **전부 404** 발생.

---

## 6. 🔧 최종 해결: VitePress base 설정

### 파일 생성/수정
```
docs/.vitepress/config.js
```

### 내용

```js
import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/lyri-studio/',
})
```

✔ 저장소 이름과 동일하게 설정해야 함.

---

## 7. 🔁 재배포

```bash
git add .
git commit -m "Fix VitePress base path"
git push
```

GitHub Actions 자동 실행 → 정상 배포됨.

---

## 8. 🎉 최종 결과: 정상 페이지 표시됨

정상 로딩 시:

- CSS 정상  
- 레이아웃 정상  
- Sidebar / Navbar 정상  
- 이미지 로딩 정상  
- 페이지 전환 문제 없음  

---

## 9. 📦 브랜치 구조 정리

```
main       → 소스 코드(VitePress 문서)
gh-pages   → 빌드 결과물(자동 생성)
```

---

## 10. 🔍 요약 표

| 단계 | 설명 |
|------|------|
| 1 | GitHub Actions 배포 Workflow 생성 |
| 2 | Dead-Link 오류 해결 |
| 3 | Actions 권한 설정 수정 |
| 4 | gh-pages 브랜치 자동 생성 |
| 5 | CSS 깨짐 → base 설정 문제 |
| 6 | `base: '/lyri-studio/'` 설정 후 해결 |
| 7 | 재배포 후 정상 표시 |

---

## 11. 📌 구조 추천 (Lyri × Brian Studio)

```
docs/
 ├─ index.md
 ├─ blog/
 ├─ studio/
 ├─ overlay/
 └─ academy/
```

```

