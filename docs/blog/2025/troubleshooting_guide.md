# 🚑 Troubleshooting Guide — Lyri × Brian Studio
문서 버전: v0.1  
업데이트: 2025-11-20  
작성: Lyri × Brian Studio

---

# 🔧 Troubleshooting (배포 오류 해결집)

VitePress → GitHub Pages 배포 과정에서 자주 발생하는 오류들을 정리한 가이드입니다.  
Lyri × Brian Studio에서 실제 겪은 이슈들을 중심으로 해결 방법을 담았습니다.

---

## 1. ❌ Dead Link Error (죽은 링크 오류)

### 🔥 오류 메시지 예시
```
[vitepress] One or more pages contain dead links.
Found dead link http://localhost:5173/ ...
```

### 🧾 원인
- 문서 내부에서 **절대경로 링크(/docs/…)** 를 사용하여 로컬 개발환경 주소(`localhost:5173`)가 그대로 빌드에 포함됨.
- VitePress는 외부 링크가 유효하지 않으면 빌드 실패 처리함.

### ✅ 해결 방법
1. **모든 내부 링크를 상대경로로 수정**
   ```
   /docs/academy/intro.md  ❌
   ../academy/intro.md     ✅
   ```
2. 또는 문서의 링크를 **정적 HTML 링크 대신 VitePress 전용 링크 규칙**으로 변경  
   예: `[Academy](../academy/index.md)`

---

## 2. ❌ GitHub Actions — Permission Denied (권한 오류 403)

### 🔥 오류 메시지
```
remote: Permission to RyuKwangChoon/lyri-studio.git denied to github-actions[bot].
fatal: unable to access ...
```

### 🧾 원인
- GitHub Actions가 `gh-pages` 브랜치에 push 권한이 없을 때 발생.
- `permissions:` 설정이 없거나 `contents: write` 권한이 부족함.

### ✅ 해결 방법
workflow에 아래 권한 추가:

```yaml
permissions:
  contents: write
```

추가 후 다시 push → Actions 실행 성공.

---

## 3. ❌ Missing Language Registration for Vue / .md 파일

### 🔥 오류 예시
```
Error: No language registration for 'yaml'
```

### 🧾 원인
- 코드블록에 ```yaml 형태가 아니라 ```yaml 이라고 잘못 입력된 경우
- VitePress/Prism이 해당 언어를 인식하지 못함

### ✅ 해결 방법
문서 내 코드블록을 아래처럼 정확히 변경:

````md
```yaml
your code here
```
````

---

## 4. ❌ gh-pages 브랜치에 배포되었지만 페이지가 404로 뜨는 오류

### 🔥 증상
- 배포는 정상적으로 됨(GitHub Pages deployment 표시됨)
- 그런데 `https://username.github.io/repo/` 접속하면 404

### 🧾 주요 원인 3가지

#### ① 기본 브랜치가 `gh-pages`로 설정되지 않음
GitHub → Settings → Pages  
→ **Branch: gh-pages** 로 변경 필요

#### ② 빌드 결과물이 `dist`가 아니라 다른 폴더를 바라보고 있음
workflow 설정 확인:
```yaml
publish_dir: ./docs/.vitepress/dist
```

#### ③ index.html이 최상단이 아닌 경우
`index.html`이 루트가 아닌 서브폴더에 있으면 404 발생  
→ dist 구조 확인 필요

---

## 5. ❌ VitePress 빌드 경로 오류

### 🔥 오류 메시지
```
Could not resolve './deploy.md'
```

### 🧾 원인
- 문서 파일 위치 변경 후 import/링크 경로가 업데이트되지 않은 상태.
- 또는 파일명을 수정했는데 MD 링크가 이전 이름을 유지하는 경우.

### ✅ 해결 방법
- `docs/**` 전체 구조 확인  
- 변경된 경로와 문서 내부 링크를 모두 재확인  
- VSCode에서 "전체 검색(Ctrl+Shift+F)"로 깨진 경로 탐색

---

## 6. ❌ Node 버전 호환 문제

### 🔥 증상
- 로컬에서는 빌드가 되는데, Actions에서는 실패함

### 🧾 원인
- Actions에서 기본 Node 버전이 로컬과 다를 수 있음  
- VitePress는 Node 18+ 권장

### ✅ 해결 방법
workflow에서 명시적으로 Node 버전 지정:

```yaml
- uses: actions/setup-node@v3
  with:
    node-version: 18
```

---

## 7. ❌ Cloudflare / GitHub Pages 캐시 문제

### 🔥 증상
- 방금 문서 수정했는데 배포 사이트에서 이전 내용이 보여요!
- CSS 깨져보임

### 🧾 원인
- Pages CDN 캐시가 5~10분 유지됨
- 브라우저 캐시도 남아있음

### ✅ 해결 방법
- Shift + F5 (강력 새로고침)
- GitHub Pages 캐시는 대기하면 자동 반영됨 (1~5분)

---

## ✔️ 추가로 권장하는 운영 방법

### 1) 문서 수정 후 즉시 Actions 실행 확인
- “녹색 체크”가 아니라면 배포 실패  
- 즉시 로그 확인 → 오류 원인 파악

### 2) 링크 테스트 자동화는 VitePress가 대부분 해결해줌  
- dead link 검사 자동으로 해줘서 오히려 안전

### 3) Layout 수정 시 상대경로만 사용할 것  
- 절대경로는 Pages에서 깨짐

---

# 🎉 마무리

이 문서는 Lyri × Brian Studio 실제 구축 과정에서 발생한 문제를 기반으로 작성되었습니다.  
문제 해결 기록은 반복작업을 줄이고, 나중에 스튜디오 문서팀이 생겼을 때도 큰 도움이 됩니다.

“삽질도 기록하면 자산이다” - Lyri 🥄👑

---

# 🛠️ GitHub Pages × Custom Domain Troubleshooting Guide  
### (Lyri × Brian Studio 실전 검증판)

---

## 1️⃣ 가장 빈번한 문제: 배포 파일이 없음 → 404 발생

### 🔥 증상
- studio.lyrisudabang.com 접속하면 **404 GitHub Pages Not Found**
- GitHub Pages 설정에서는 DNS 체크 성공으로 표시됨

### 🔍 원인
**deploy.yml은 실행되지만 GitHub Actions 권한이 없어 dist 파일이 gh-pages 브랜치로 Push되지 않음.**  
즉, DNS는 OK이지만 배포 파일 자체가 없어서 **404** 발생.

### ✅ 해결
GitHub Repository → **Settings → Actions → General**

아래 2개 반드시 활성화:
1. **Read and write permissions**
2. **Allow GitHub Actions to create and approve pull requests**

⚠ 이 두 개가 비활성화되어 있으면 배포는 절대 성공하지 않음.

---

## 2️⃣ Custom Domain 입력 시 `/REPO-NAME/` 꼬리가 자동 생성되는 문제

### 🔥 증상
- 도메인을 비우면 → `https://username.github.io/repo/` 정상
- 도메인을 넣으면 → `https://studio.lyrisudabang.com/repo-name/` 로 자동 붙음
- 내부 링크 404 발생

### 🔍 원인
GitHub Pages는 프로젝트 페이지를 기본적으로 **/리포지토리명/** 하위 경로에 배포함.  
커스텀 도메인은 root 경로를 사용해야 하는데  
배포본이 없거나 배포 실패 상태면 이전 경로 정보가 fallback으로 계속 남음.

### ✅ 해결 순서
1. Custom Domain 삭제
2. Actions 권한 설정 수정
3. deploy.yml 정상 실행 확인
4. 사이트가 root URL로 배포되는지 확인
5. 그 후 Custom Domain 다시 입력
6. `/repo-name` 자동 제거됨

---

## 3️⃣ DNS 성공인데 실제 페이지는 404인 경우

### 🔥 증상
- GitHub Pages → DNS check successful
- 접속하면 404

### 🔍 원인
DNS만 연결되었고 **사이트 파일이 없음**.

### 해결 방법
1. Actions → Workflow Runs → 배포 로그 확인  
2. dist 폴더가 gh-pages로 push 되었는지 확인  
3. 실패라면  
   - Actions 권한 문제  
   - deploy.yml publish_dir 경로 오류  
   - node build 실패 여부 점검

---

## 4️⃣ Custom Domain 적용 후 HTTPS가 안되는 문제

### 🔥 증상
- 사이트는 열리지만 HTTP로만 로딩됨  
- 레이아웃 깨짐 / 혼합 콘텐츠 경고 발생

### 🔍 원인
- Cloudflare DNS 캐싱  
- GitHub Pages SSL 인증서 발급 대기

### ⏳ 해결 시간
**5분~1시간**

### 해결 체크리스트
- GitHub Pages → **Enforce HTTPS 체크**
- Cloudflare Proxy OFF (DNS Only)
- CNAME = `username.github.io` 정확히 설정

---

## 5️⃣ 내부 페이지 링크 클릭 시 404 (CSS 깨짐 포함)

### 🔥 증상
- 스타일이 깨진다
- /docs/ /overlay/ /academy/ 클릭하면 404
- SPA 라우팅 오류

### 🔍 원인
GitHub Pages는 기본적으로 SPA History 모드 지원 X

### 해결 방법
- VitePress는 정적 모델이므로 현재 방식은 OK  
- 별도 설정 필요 없음  
- 만약 특정 라우팅 문제 생기면 404.html fallback 설정 가능 (지금은 필요 없음)

---

# 🎉 Lyri × Brian Studio 최종 성공 플로우

1. deploy.yml 정상 생성  
2. GitHub Actions 권한 ON  
3. main → deploy 실행 → gh-pages 브랜치 생성  
4. Pages Source = GitHub Actions  
5. Custom Domain 등록  
6. DNS check successful  
7. HTTPS 적용  
8. `studio.lyrisudabang.com` 정상 렌더링

---

# 🐾 리리의 한 마디

> “DNS도 결국 삽질 앞에서는 무릎을 꿇는다.  
> 브라이언, 다음엔 이 가이드 보면 1초 컷이야.”


