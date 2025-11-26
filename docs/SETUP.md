# Control My Taste 설정 가이드

이 앱을 사용하려면 YouTube Data API 설정이 필요합니다. 아래 단계를 따라주세요.

## 1. Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 상단의 프로젝트 선택 → **새 프로젝트** 클릭
3. 프로젝트 이름 입력 (예: `my-music-app`) → **만들기**

## 2. YouTube Data API 활성화

1. 좌측 메뉴 → **API 및 서비스** → **라이브러리**
2. "YouTube Data API v3" 검색
3. **사용** 버튼 클릭

## 3. OAuth 동의 화면 설정

1. 좌측 메뉴 → **API 및 서비스** → **OAuth 동의 화면**
2. User Type: **외부** 선택 → **만들기**
3. 앱 정보 입력:
   - 앱 이름: 아무거나 (예: `My Music App`)
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 이메일: 본인 이메일
4. **저장 후 계속**
5. 범위(Scopes) 페이지: **범위 추가 또는 삭제** 클릭
   - `https://www.googleapis.com/auth/youtube.readonly` 검색하여 체크
   - **업데이트** 클릭
6. **저장 후 계속**
7. 테스트 사용자 페이지: **Add Users** 클릭
   - 본인 Gmail 주소 추가
8. **저장 후 계속**

## 4. OAuth 클라이언트 ID 생성

1. 좌측 메뉴 → **API 및 서비스** → **사용자 인증 정보**
2. 상단 **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
3. 애플리케이션 유형: **데스크톱 앱**
4. 이름: 아무거나 (예: `Desktop Client`)
5. **만들기** 클릭
6. **JSON 다운로드** 클릭

## 5. credentials.json 배치

1. 다운로드한 JSON 파일 이름을 `credentials.json`으로 변경
2. 앱 루트 폴더에 배치 (package.json과 같은 위치)

```
control_my_taste/
├── credentials.json  ← 여기에 배치
├── package.json
├── ...
```

## 6. 첫 실행 및 인증

1. 앱 실행: `npm run dev`
2. 사이드바의 **YouTube 동기화** 버튼 클릭
3. 브라우저가 열리면 Google 계정으로 로그인
4. "이 앱은 확인되지 않았습니다" 경고가 뜨면:
   - **고급** 클릭 → **[앱 이름](으)로 이동 (안전하지 않음)** 클릭
5. 권한 허용
6. "인증이 완료되었습니다" 메시지 확인
7. 앱으로 돌아가서 동기화 완료 확인

인증 완료 후 `token.json` 파일이 자동 생성됩니다.

## 문제 해결

### "redirect_uri_mismatch" 에러
OAuth 클라이언트 생성 시 **데스크톱 앱**을 선택했는지 확인하세요.

### "access_denied" 에러
OAuth 동의 화면에서 테스트 사용자로 본인 이메일을 추가했는지 확인하세요.

### 토큰 만료
`token.json` 파일을 삭제하고 다시 동기화하면 재인증됩니다.

## 주의사항

- `credentials.json`과 `token.json`은 개인 정보가 포함되어 있으니 공유하지 마세요
- API 할당량: 일일 10,000 단위 (일반 사용에는 충분)
