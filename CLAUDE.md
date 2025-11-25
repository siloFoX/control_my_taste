# Claude Code 프로젝트 가이드

## 프로젝트 개요

Control My Taste - YouTube 좋아요 목록 기반 개인 음악 평가 앱

## 기술 스택

- Electron + React + TypeScript
- Tailwind CSS
- YouTube Data API v3
- 데이터: JSON 파일 저장

## 주요 명령어

```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 (추후)
npm run build        # 빌드 (추후)
```

## 프로젝트 구조

```
control_my_taste/
├── electron/        # Electron 메인 프로세스
├── src/             # React 프론트엔드
│   ├── components/  # 재사용 컴포넌트
│   ├── pages/       # 페이지 (MusicList, Evaluate, Trash)
│   ├── services/    # API, 스토리지 서비스
│   └── types/       # TypeScript 타입
├── data/            # JSON 데이터 파일
├── credentials.json # YouTube OAuth (gitignore)
└── token.json       # 인증 토큰 (gitignore)
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

## 주의사항

- `credentials.json`, `token.json`은 절대 커밋하지 않음
- 민감 정보는 `.gitignore`에 포함됨
