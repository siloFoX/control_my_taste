# Claude Code 프로젝트 가이드

## 프로젝트 개요

Control My Taste - YouTube 좋아요 목록 기반 개인 음악 평가 앱

## 현재 진행 상황 (2025-11-25)

### 완료된 작업
- [x] 프로젝트 기본 구조 설정 (Electron + React + TypeScript + Vite)
- [x] Tailwind CSS 설정
- [x] 기본 UI 레이아웃 구현 (사이드바 + 메인 컨텐츠)
- [x] 라우팅 설정 (/, /evaluate, /trash)
- [x] 페이지 컴포넌트 생성 (MusicList, Evaluate, Trash)
- [x] ES Module 호환성 문제 해결 (package.json에 "type": "module" 추가)
- [x] Electron preload 스크립트 CommonJS 분리 빌드 설정

### 다음 작업 (TODO)
- [ ] YouTube Data API 연동 (OAuth 인증)
- [ ] 음악 목록 동기화 기능 구현
- [ ] 평가 기능 구현 (별점 + 코멘트)
- [ ] 데이터 저장/로드 (JSON 파일)
- [ ] 블랙리스트 기능 구현

## 기술 스택

- Electron + React + TypeScript
- Vite (빌드 도구)
- Tailwind CSS
- React Router DOM v6
- Lucide React (아이콘)
- YouTube Data API v3
- 데이터: JSON 파일 저장

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
│   ├── main.ts           # Electron 메인 프로세스 (ES Module)
│   └── preload.ts        # Preload 스크립트 (CommonJS로 빌드됨)
├── src/
│   ├── main.tsx          # React 엔트리포인트
│   ├── App.tsx           # 라우팅 설정
│   ├── components/
│   │   └── Layout.tsx    # 사이드바 + 메인 레이아웃
│   └── pages/
│       ├── MusicList.tsx # 음악 목록 페이지 (메인)
│       ├── Evaluate.tsx  # 평가 페이지
│       └── Trash.tsx     # 휴지통 페이지
├── dist/electron/        # Electron 빌드 출력
├── tsconfig.json         # React용 TypeScript 설정
├── tsconfig.electron.json # Electron main용 (ES Module)
├── tsconfig.preload.json # Preload용 (CommonJS)
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 핵심 기능

1. **YouTube 동기화**: 앱 시작 시 + 수동 버튼
2. **평가 페이지**: 랜덤 음악 선정 → 별점(1-5) + 코멘트(선택)
3. **블랙리스트**: 삭제된 항목은 동기화 시 제외

## 데이터 스키마

```typescript
interface Music {
  id: string;
  youtubeId: string;
  title: string;
  artist?: string;
  rating?: number;      // 1-5
  comments: Comment[];
  addedAt: string;
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

### React Router 경고
v7 업그레이드 관련 경고 → 나중에 처리해도 됨.

## 주의사항

- `credentials.json`, `token.json`은 절대 커밋하지 않음
- 민감 정보는 `.gitignore`에 포함됨
- Electron 앱은 **Windows PowerShell에서 실행** 권장 (WSL2 X)
