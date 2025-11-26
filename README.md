# Control My Taste

YouTube 좋아요 목록 기반 개인 음악 평가 및 관리 데스크톱 애플리케이션

## 주요 기능

### 음악 목록
- YouTube 좋아요 목록 자동 동기화
- 썸네일, 제목, 채널명, 별점, 코멘트 표시
- 검색 및 동적 페이징
- 상세 정보 모달 (태그, 토픽, 재생 시간)

### 조건 검색
- 포함/미포함 조건 설정
  - 별점, 채널명, 키워드(코멘트+태그), 코멘트, 태그, 코멘트 유무, Hype Up/Down
- 검색 템플릿 저장/불러오기
- 검색 조건 및 결과 유지

### 평가하기
- 미평가 음악 랜덤 선택
- 별점 (1-5점) 부여
- 코멘트 추가/수정/삭제
- Hype Up/Down (무제한 클릭)

### 휴지통
- 삭제된 항목 확인 및 복구
- 블랙리스트 항목은 동기화 시 제외

## 기술 스택

- **프레임워크**: Electron + React
- **언어**: TypeScript
- **빌드 도구**: Vite
- **스타일링**: Tailwind CSS
- **아이콘**: Lucide React
- **데이터 저장**: JSON 파일 (로컬)
- **외부 연동**: YouTube Data API v3

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# React만 실행 (http://localhost:5173)
npm run dev:react

# 프로덕션 빌드
npm run build
```

**참고**: WSL2에서 Electron 실행 시 D-Bus 에러가 발생할 수 있습니다. Windows PowerShell에서 직접 실행을 권장합니다.

## YouTube API 설정

앱을 사용하려면 YouTube Data API 설정이 필요합니다. 자세한 설정 가이드는 [docs/SETUP.md](docs/SETUP.md)를 참고하세요.

### 빠른 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. YouTube Data API v3 활성화
3. OAuth 2.0 클라이언트 ID 생성 (데스크톱 앱)
4. 다운로드한 JSON 파일을 `credentials.json`으로 프로젝트 루트에 저장
5. 앱 실행 후 YouTube 동기화 버튼 클릭하여 인증

## 프로젝트 구조

```
control_my_taste/
├── electron/           # Electron 메인 프로세스
│   ├── main.ts
│   ├── preload.ts
│   └── services/
├── src/                # React 프론트엔드
│   ├── components/
│   ├── pages/
│   └── types/
├── data/               # 데이터 저장 (gitignore)
│   ├── music.json
│   ├── blacklist.json
│   └── templates.json
└── docs/               # 문서
    └── SETUP.md
```

## 라이선스

MIT
