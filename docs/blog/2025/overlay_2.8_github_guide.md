# 🛠️ Overlay 2.8 → GitHub 연결 가이드  
Lyri × Brian Studio · v1.0  

오버레이 3.0 리팩토링을 시작하기 전, **현재 Overlay v2.8 프로젝트를 GitHub에 연결**하여  
안정판 스냅샷을 보관하고 이후 리뉴얼 작업을 안전하게 진행하기 위한 공식 가이드입니다.

---

## 📌 1. GitHub 레포지토리 생성

### 1) 기본 정보
- **Repository name:** `lyri-overlay`
- **Visibility:** `Private`  
  (사내용 코드이므로 무조건 비공개)
- **README:** Off
- **.gitignore:** Node (Vue·Express 함께 고려)
- **License:** No License

### 2) 생성 후 표시되는 Git 명령어  
생성 직후 GitHub에서 다음과 같은 안내가 뜹니다:

```bash
git init
git add .
git commit -m "init overlay v2.8"
git branch -M main
git remote add origin https://github.com/ACCOUNT/lyri-overlay.git
git push -u origin main
```

---

## 📌 2. 로컬 프로젝트(Overlay 2.8)에 Git 연결

### 1) 폴더에서 Git 초기화
Overlay2.8 프로젝트 폴더에서 아래 명령 실행:

```bash
git init
git add .
git commit -m "Overlay v2.8 initial snapshot"
```

### 2) GitHub와 연결
```bash
git remote add origin https://github.com/ACCOUNT/lyri-overlay.git
git branch -M main
git push -u origin main
```

---

## 📌 3. 브랜치 구조 설계 (Lyri Studio 표준)

3.0 리팩토링에 대비해 아래 구조를 권장합니다.

```
main        ← 운영/안정판  
v2.8        ← 현재 버전 스냅샷  
v3.0-dev    ← 3.0 리팩토링 코드 작업  
v3.0-design ← 3.0 아키텍처/문서 작업  
```

### 브랜치 생성
```bash
# 현재 main에서 v2.8 브랜치 생성
git checkout -b v2.8
git push -u origin v2.8

# 3.0 개발용 브랜치 생성
git checkout main
git checkout -b v3.0-dev
git push -u origin v3.0-dev
```

---

## 📌 4. 왜 지금 Git 연동을 해야 하는가?

### ✔ 1) Overlay 3.0 리팩토링 준비  
코드 구조 대개편이 들어가기 때문에  
**2.8 상태 보관**은 필수.

### ✔ 2) 브라이언·리리 팀플레이 최적화  
문서·설계·코드 분업이 가능해짐.

### ✔ 3) 회귀 테스트, 안정판 유지  
문제가 생겨도 main 또는 `v2.8` 스냅샷으로 즉시 복원 가능.

---

## 📌 5. 이후 진행 플로우

1. GitHub 레포지토리 생성  
2. 로컬 Overlay2.8 프로젝트 Git 연결  
3. main → v2.8 스냅샷 저장  
4. v3.0-dev 브랜치 생성  
5. Codex-Max Agent 투입하여 3.0 설계/리팩토링 진행  
6. 완료 후 main에 머지

---

## ✨ 부록: 문제 해결 Q&A

### ❓ “기존 코드 Git에 올리면 정상적으로 히스토리 관리 될까?”
→ 처음 스냅샷부터 관리되므로 완벽함.

### ❓ “서버도 함께 Git에 올려도 되나?”
→ Yes. 단, `.env` 파일은 반드시 제외.

`.gitignore` 예시:
```
node_modules/
dist/
.env
```

---

## 🐾 Lyri Studio 서명
이 문서는 리리소장과 브라이언이 함께 작성한  
**Overlay v2.8 공식 GitHub 연결 가이드 v1.0** 입니다.
