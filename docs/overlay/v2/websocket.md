# WebSocket 동작 요약

Overlay v2는 WebSocket을 사용해 다음 정보를 실시간 전달합니다.

- NowPlaying 상태  
- 재생 제어 이벤트  
- 메시지·공지 전송  
- Overlay 화면 갱신

연결 안정화를 위해 heartbeat·재연결 로직을 포함하고 있습니다.
