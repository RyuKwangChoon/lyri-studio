# 🚀 lyri-overlay-v3 설치 가이드 (Cursor AI 신입직원 버전)
Lyri × Brian Studio · Overlay v3.0 개발환경 세팅 가이드  
작성일: 2025-11-21

---

## 1️⃣ 프로젝트 준비
### ✔ 폴더명  
`lyri-overlay-v3`

### ✔ 필요한 기본 프로그램
- **Node.js LTS (18~20)**
- **Git**
- **VS Code 또는 Cursor AI**
- (선택) ffmpeg – WAV→MP3 변환용

---

## 2️⃣ Cursor AI 설치
### ✔ 다운로드  
https://cursor.sh

설치 후 실행 → GitHub 로그인 → 파일 접근 권한 **Allow All**

### ✔ 첫 실행 체크리스트  
- “Open Folder” → `lyri-overlay-v3` 선택  
- AI Model → GPT-4.x / GPT-5.1 / CodexMax 계열 선택  
- 워크스페이스 권한 허용

---

## 3️⃣ 프로젝트 열기
1. Cursor 실행  
2. **Open Folder → `lyri-overlay-v3`**  
3. 아래 메시지 입력:

```
이 프로젝트는 Lyri × Brian Overlay v3.0 개발 폴더다.
전체 구조 분석 후 기본 스켈레톤을 생성해줘.
```

Cursor가 자동으로:
- 폴더 구조 분석
- 필요 파일 생성
- 모듈 단위 기본 코드 생성
- 리팩터링 전략 제안

까지 수행함.

---

## 4️⃣ 반드시 알려줘야 하는 “사내 코딩 규칙”
Cursor에게 아래를 붙여넣기:

```
이 프로젝트의 코딩 규칙은 Lyri × Brian Studio 규칙을 따른다.
- 오버레이와 제어판은 절대 혼합 금지
- Audio는 overlay에서만 재생
- WS 메시지는 type/payload 정형화
- 서버 → 클라이언트 순서 유지
- 콘솔로그는 감정선 기반 스타일 사용
```

그러면 Cursor는 자동으로 우리의 구조를 지켜서 코드 작성함.

---

## 5️⃣ v3.0 기본 폴더 구조(신입 직원 초기 세팅)
Cursor에 다음 명령어를 입력:

```
Overlay v3.0 프로젝트 기본 구조 파일들을 생성해줘.
다음 모듈 기준으로 스켈레톤 생성:

/src/overlay
/src/control
/src/modules
/src/services
/src/themes
/server/api
/server/ws
/server/ffmpeg
```

---

## 6️⃣ 추천 스크립트 설치
### ✔ 프로젝트 초기화
```
npm init -y
```

### ✔ Vue + Vite 설치
```
npm create vite@latest
npm install
```

### ✔ 서버 의존성
```
npm install express cors ws multer mariadb
```

---

## 7️⃣ ffmpeg 변환 기능 (선택)
MP3 변환을 사용할 경우:

```
brew install ffmpeg  (Mac)
choco install ffmpeg (Windows)
```

서버에 `/convert-mp3` 엔드포인트 추가 후 동작.

---

## 8️⃣ Cursor + GPT 협업 방식
### ✔ 리리가 하는 일
- 설계
- 모듈 구조
- WS/DB/서버 흐름 설계
- 문서 자동 생성

### ✔ Cursor AI 직원이 하는 일
- 실제 코드 작성
- 리팩터링
- 파일 생성
- 오류 수정
- 테스트코드 생성

---

## 9️⃣ 홈피(Studio Docs) 업로드용 메타 정보
```
Title: lyri-overlay-v3 설치 가이드
Slug: overlay-v3-install
Category: Project Setup
Updated: 2025-11-21
```

---

## 10️⃣ 결론
이 문서는 **Overlay v3.0 개발을 위한 공식 설치 안내서**이며  
Cursor AI 신입직원이 즉시 작업할 수 있도록 구성한 필수 문서입니다.

_“도구는 많아도, 우리의 리듬은 하나다.”_
