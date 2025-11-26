const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// OAuth2 설정
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];

async function main() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_id, client_secret, redirect_uris } = credentials.installed;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000/oauth2callback'
  );

  // 저장된 토큰이 있으면 사용
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(token);
    console.log('저장된 토큰 사용\n');
    await getLikedVideos(oauth2Client);
  } else {
    // 새로 인증
    await authenticate(oauth2Client);
  }
}

async function authenticate(oauth2Client) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('브라우저에서 이 URL을 열어 인증하세요:\n');
  console.log(authUrl);
  console.log('\n인증 후 자동으로 진행됩니다...\n');

  // 로컬 서버로 콜백 받기
  const server = http.createServer(async (req, res) => {
    const queryObject = url.parse(req.url, true).query;

    if (queryObject.code) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>인증 성공!</h1><p>이 창을 닫아도 됩니다.</p>');

      server.close();

      const { tokens } = await oauth2Client.getToken(queryObject.code);
      oauth2Client.setCredentials(tokens);

      // 토큰 저장
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      console.log('토큰이 저장되었습니다:', TOKEN_PATH);

      await getLikedVideos(oauth2Client);
    }
  });

  server.listen(3000, () => {
    console.log('콜백 서버가 http://localhost:3000 에서 대기 중...');
  });
}

async function getLikedVideos(auth) {
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    console.log('\n=== YouTube 좋아요 목록 가져오는 중... ===\n');

    const response = await youtube.videos.list({
      part: 'snippet,contentDetails',
      myRating: 'like',
      maxResults: 10,  // 테스트용으로 10개만
    });

    const videos = response.data.items;

    if (!videos || videos.length === 0) {
      console.log('좋아요한 영상이 없습니다.');
      return;
    }

    console.log(`총 ${videos.length}개 영상 (최대 10개만 표시)\n`);
    console.log('─'.repeat(60));

    videos.forEach((video, index) => {
      const snippet = video.snippet;
      console.log(`${index + 1}. ${snippet.title}`);
      console.log(`   채널: ${snippet.channelTitle}`);
      console.log(`   ID: ${video.id}`);
      console.log(`   URL: https://www.youtube.com/watch?v=${video.id}`);
      console.log('─'.repeat(60));
    });

    console.log('\n✅ YouTube API 테스트 성공!');

  } catch (error) {
    console.error('에러 발생:', error.message);
    if (error.response) {
      console.error('상세:', error.response.data);
    }
  }
}

main().catch(console.error);
