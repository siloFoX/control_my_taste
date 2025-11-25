# Control My Taste

개인 음악 리스트를 저장, 관리, 평점 매기기 및 추천하는 윈도우 데스크톱 애플리케이션

## 주요 기능

- **YouTube 동기화**: 좋아요 목록에서 자동으로 음악 가져오기
- **평가 시스템**: 랜덤으로 선정된 음악에 별점(1-5점) 및 코멘트 저장
- **음악 관리**: 검색, 필터링, 정렬
- **블랙리스트**: 불필요한 영상 관리

## 기술 스택

- **프레임워크**: Electron + React
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **데이터 저장**: JSON 파일 (로컬)
- **외부 연동**: YouTube Data API v3

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행 (추후 구현)
npm run dev

# 빌드 (추후 구현)
npm run build
```

## 설정

### YouTube API 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. YouTube Data API v3 활성화
3. OAuth 2.0 클라이언트 ID 생성 (데스크톱 앱)
4. 다운로드한 JSON 파일을 `credentials.json`으로 저장

## 라이선스

MIT
