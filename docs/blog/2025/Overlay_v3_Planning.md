# 🎛️ Overlay v3.0 기획 설계 (2.8 기반 리뉴얼판)

## 1. 전체 시스템 개요
오버레이는 4대 기능 영역으로 구성됩니다:
1) Overlay UI  
2) Track Control Panel  
3) Audio/NowPlaying 엔진  
4) File Upload / WAV→MP3 변환

---

## 2. Overlay 화면 컴포넌트
### OverlayShell.vue
- 전체 레이아웃, 배경, 테마

### TitleNotice.vue
- 공지 타이틀 출력

### TopNoticeLoop.vue
- 상단 공지 슬라이드 루프

### BottomNoticeLoop.vue
- 하단 공지 루프

### SubtitleLayer.vue
- 말풍선 시스템 (lyri, brian, system)

### NowPlayingPreview.vue
- 오버레이용 NowPlaying 박스

---

## 3. Track Control Panel 컴포넌트
### TrackList.vue
- 정렬, 제목수정, 삭제

### RepeatSelector.vue
- 반복 none/one/all

### PlaySourceToggle.vue
- overlay/control 선택

### NowPlayingInfo.vue
- 재생중 트랙정보

### TrackUploader.vue
- MP3/WAV 업로드

### Mp3BatchConverter.vue
- WAV→MP3 변환 실행

---

## 4. NowPlaying / Audio 엔진 모듈
### nowPlayingManager.js
- WS 연결, 진행률, remainTime

### audioControl.js
- play/pause, metadata 처리

### autoSyncWorker.js
- 진행률 워커, next-track, repeat

### ApiService.js
- fetch 호출 통합

### WsRelayService.js
- 자막/오디오 WS 관리

---

## 5. File System / 변환 기능
### convertToMp3.js
- 입력·출력 폴더 → 서버 변환 요청

### convert-mp3 서버 엔드포인트
- FFmpeg로 WAV→MP3 변환

---

## 6. CSS / 테마 구성
### overlay.css
- OBS 기본 레이아웃

### nowPlaying.css
- 진행바, 하이라이트

### trackControl.css
- 제어판 스타일

### theme system
- christmas / calm / focus 등

---

## 요약
이 기획서는 Overlay v3.0을 구성하기 위한 2.8 기능 기반 컴포넌트·모듈 구조 설계입니다.
