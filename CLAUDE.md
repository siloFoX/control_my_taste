# Claude Code 프로젝트 가이드

## 프로젝트 개요

Control My Taste - YouTube 좋아요 목록 기반 개인 음악 평가 앱

## 현재 진행 상황 (2025-11-26)

### 완료된 작업
- [x] 프로젝트 기본 구조 설정 (Electron + React + TypeScript + Vite)
- [x] Tailwind CSS 설정
- [x] 기본 UI 레이아웃 구현 (사이드바 + 메인 컨텐츠)
- [x] 라우팅 설정 (/, /evaluate, /trash)
- [x] ES Module 호환성 문제 해결
- [x] YouTube Data API 연동 (OAuth 인증)
- [x] 음악 목록 동기화 기능 구현
- [x] 음악 목록 페이지 (썸네일, 별점, 검색, 삭제, 코멘트)
- [x] 평가하기 페이지 (랜덤 선택, 별점 + 코멘트)
- [x] 휴지통 페이지 (블랙리스트 확인/복구)
- [x] 데이터 저장/로드 (JSON 파일)
- [x] 블랙리스트 기능 (삭제 시 재동기화 제외)

### 다음 작업 (TODO)
- [ ] UI/UX 개선 (피드백 반영)
- [ ] 프로덕션 빌드 테스트

## 기술 스택

- Electron + React + TypeScript
- Vite (빌드 도구)
- Tailwind CSS
- React Router DOM v6
- Lucide React (아이콘)
- YouTube Data API v3
- googleapis (Node.js 라이브러리)
- 데이터: JSON 파일 저장 (data/music.json, data/blacklist.json)

## 주요 명령어

```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 실행 (React + Electron 동시)
npm run dev:react    # React만 실행 (http://localhost:5173)
npm run build        # 프로덕션 빌드
```

**중요**: WSL2에서 Electron 실행 시 D-Bus 에러 발생함. **Windows PowerShell에서 직접 실행 권장**.

## 프로젝트 구조

```
control_my_taste/
├── electron/
│   ├── main.ts              # Electron 메인 프로세스 + IPC 핸들러
│   ├── preload.ts           # Preload 스크립트 (CommonJS로 빌드)
│   └── services/
│       ├── youtube.ts       # YouTube API 서비스
│       └── storage.ts       # JSON 파일 저장/로드
├── src/
│   ├── main.tsx             # React 엔트리포인트
│   ├── App.tsx              # 라우팅 설정
│   ├── components/
│   │   └── Layout.tsx       # 사이드바 + 동기화 버튼
│   ├── pages/
│   │   ├── MusicList.tsx    # 음악 목록 (검색, 별점, 코멘트, 삭제)
│   │   ├── Evaluate.tsx     # 랜덤 평가 (별점 + 코멘트)
│   │   └── Trash.tsx        # 휴지통 (복구)
│   └── types/
│       └── electron.d.ts    # IPC API 타입 정의
├── data/
│   ├── music.json           # 음악 데이터
│   └── blacklist.json       # 블랙리스트
├── credentials.json         # YouTube OAuth (gitignore)
├── token.json               # 인증 토큰 (gitignore)
├── tsconfig.json            # React용
├── tsconfig.electron.json   # Electron main용 (ES Module)
└── tsconfig.preload.json    # Preload용 (CommonJS)
```

## 핵심 기능

1. **YouTube 동기화**: 좋아요 목록에서 최대 100개 가져오기
2. **음악 목록**: 썸네일, 제목, 채널명, 별점, 코멘트, 검색, 삭제
3. **평가하기**: 미평가 음악 랜덤 선택 → 별점(1-5) + 코멘트(선택)
4. **휴지통**: 삭제된 항목 확인/복구 (블랙리스트)

## IPC API

```typescript
// YouTube
syncYoutube()                    // 동기화

// Music
loadMusic()                      // 목록 로드
updateRating(youtubeId, rating)  // 별점 저장
deleteMusic(youtubeId)           // 삭제 + 블랙리스트 등록
addComment(youtubeId, comment)   // 코멘트 추가
deleteComment(youtubeId, index)  // 코멘트 삭제

// Blacklist
loadBlacklist()                  // 블랙리스트 로드
restoreFromBlacklist(youtubeId)  // 복구
```

## 데이터 스키마

```typescript
interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  addedAt: string;
  rating?: number;      // 1-5
  comments: string[];
}

interface BlacklistItem {
  youtubeId: string;
  deletedAt: string;
}
```

## 알려진 이슈 및 해결책

### WSL2 D-Bus 에러
```
Failed to connect to the bus: Failed to connect to socket /run/user/1000/bus
```
→ 무시해도 됨. Windows PowerShell에서 실행하면 발생 안 함.

### Electron Preload ES Module 에러
```
Cannot use import statement outside a module
```
→ `tsconfig.preload.json` 분리하여 CommonJS로 빌드하도록 설정 완료.

### 경로 주의 (빌드 후)
- `electron/services/` 파일들은 빌드 후 `dist/electron/services/`에 위치
- 상대 경로 사용 시 `../../../` 로 프로젝트 루트 접근

## 주의사항

- `credentials.json`, `token.json`은 절대 커밋하지 않음
- 민감 정보는 `.gitignore`에 포함됨
- Electron 앱은 **Windows PowerShell에서 실행** 권장 (WSL2 X)
