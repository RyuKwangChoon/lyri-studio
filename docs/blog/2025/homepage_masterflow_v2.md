# 🧭 Lyri × Brian Studio 
# 홈페이지 전체 작업 순서 (마스터 플로우) v0.2  
_“구조 → 틀 → 요약 → 상세 → 배포 → 확장 → 완성”_

---

# 0단계. 전체 방향 확정 (완료)
- 홈페이지 목적 정의  
- 기술 스택 결정 (VitePress)  
- 도메인 구성(lyrisudabang.com)  
- **VitePress로 시작 확정**

👉 **이 단계 100% 완료.**

---

# 1단계. 프로젝트 환경 세팅  
_“집 짓기 전에 공구부터 정리하는 단계”_

### 해야 할 것
1. `/workspace/lyrisudabang-homepage` 생성  
2. npm 초기화  
3. VitePress 설치  
4. 개발 서버 실행  
   ```bash
   npm init vitepress@latest
   npm run docs:dev
   ```

### 결과
- 기본 홈페이지 실행됨  
- **빈 문서 상태**

---

# 2단계. 전체 IA(Information Architecture) 구축  
_“먼저 페이지 지도부터 만들기”_

### 해야 할 것
- 상단 메뉴 구조 확정  
  - Home  
  - Docs  
  - Overlay  
  - Academy  
  - Blog  
  - Studio  
- 폴더 구조 작성 (빈 파일 포함)

예)
```
docs/
  index.md
  howto/
    index.md
    install.md
    config.md
overlay/
  index.md
  v2/
    index.md
    architecture.md
    components.md
    websocket.md
    audio.md
academy/
  index.md
  vitepress/
    index.md
    basics.md
    layout.md
    deploy.md
blog/
  index.md
  2025/
    homepage-build-log.md
    overlay-dev-log.md
studio/
  index.md
  about.md
```

### 목적
- 404 제거 이전에 **전체 라우팅 확보**
- “홈페이지 전체 숲”을 먼저 만든다.

---

# 3단계. 테마/레이아웃/디자인 베이스 적용  
_“뼈대 만들어졌으면 색칠하기 전 라인을 딴다”_

### 해야 할 것
- 다크모드 구조 적용  
- global.css / custom.css 설정  
- Navbar/Sidebar 조정  
- Footer 컴포넌트 등록  
- Layout.vue 구성  
- Home Hero 영역 수정  

👉 현재 단계 **100% 완료.**

---

# 4단계. 모든 페이지에 ‘요약 버전’만 작성  
_“빈 페이지를 없애라. 하지만 한 줄씩만.”_

### 해야 할 것
모든 페이지에 **5~10줄짜리 요약 내용** 삽입:

- Docs/  
- Docs/howto/  
- Overlay/v2  
- Academy/vitepress  
- Blog/  
- Studio/  

👉 목표:  
사이트 **모든 메뉴가 이동 가능 + 의미 있는 문장 존재 + 404 없음**

---

# 5단계. 상세 문서 작성 (핵심부터)  
_“전부 쓰려고 하면 죽는다. 핵심부터.”_

### 우선순위
1) Overlay v2  
   - Architecture  
   - WebSocket  
   - Audio System  
   - TrackControl 구조  
2) Docs/howto  
   - install  
   - config  
3) Academy/vitepress  
4) Studio/세계관  
5) Blog 확장  

👉 이 단계부터 **실제 기술문서**가 만들어진다.

---

# 6단계. Cloudflare Pages 배포 준비  
_“배포는 늦게 해야 한다. 지금이 ‘제때’다.”_

### 해야 할 것
- GitHub 레포 연결  
- 프로젝트 push  
- Pages 프로젝트 생성  
- 빌드 명령 설정  
  ```bash
  npm run docs:build
  ```
- dist/ 경로 지정  
- 커스텀 도메인 연결  
- HTTPS 자동 적용  
- 프리뷰 빌드 확인  

👉 이 단계가 홈페이지 외부 공개의 첫 준비.

---

# 7단계. Cloudflare Pages 최초 배포  
_“세상에 처음으로 공개되는 순간”_

### 해야 할 것
- 배포 버튼 클릭  
- 첫 빌드 로그 확인  
- CSS/레이아웃 깨짐 여부 체크  
- 다크모드 / 네비게이션 정상 확인  
- 링크 경로 점검  
- mobile UI 확인  

👉 이 시점에서 homepage v0.1 온라인 오픈.

---

# 8단계. Overlay Academy 연동  
_“홈페이지는 땅이고, 아카데미는 지붕이다”_

### 해야 할 것
- Academy 메뉴 정비  
- 콘텐츠 프레임 구조 확정  
- v2 Demo/Preview 넣기  
- 오디오·웹소켓 시각적 설명  
- PWA 설치 준비 (선택)

---

# 9단계. 테마/애니메이션·브랜딩 강화  
_“Lyri × Brian 감성을 심는 단계”_

### 예)
- SnowLayer  
- 크리스마스 테마  
- 로고/아이콘 확정  
- Music Showcase  
- Overlay UI 데모 삽입  
- 모션 효과

---

# 10단계. 문서 & 기록 확장  
- Overlay v2 문서 70–90% 완성  
- 서버 문서 추가  
- 블로그: Dev Log / Build Log 작성  
- Release Note 구조 도입  
- 버전 기록 관리(v0.1 → v0.5 → v1.0)

---

# 11단계. 정식 오픈 (v1.0)  
- 전체 문서 정비  
- 아카데미 v1 완성  
- Overlay Demo 공개  
- 홈페이지 기능 완성도 90% 이상  

---

# 🔥 최종 요약

> **v0.2 플로우 =  
홈페이지 구축의 절대 기준점.  
이제 이 순서대로만 가면 작업이 절대 꼬이지 않는다.**
