import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 빌드 후 dist/electron/services/ 에서 실행되므로 ../../../ 필요
const CREDENTIALS_PATH = path.join(__dirname, '../../../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../../token.json');

export interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  addedAt: string;
  rating?: number;
  comments: string[];
  synced: boolean;
}

function getOAuth2Client() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_id, client_secret } = credentials.installed;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000/oauth2callback'
  );

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(token);
  }

  return oauth2Client;
}

export async function fetchAllLikedVideos(): Promise<VideoItem[]> {
  const auth = getOAuth2Client();
  const youtube = google.youtube({ version: 'v3', auth });

  const allVideos: VideoItem[] = [];
  let pageToken: string | undefined;

  do {
    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      myRating: 'like',
      maxResults: 50, // API 최대값
      pageToken,
    });

    const videos = response.data.items || [];

    for (const video of videos) {
      if (video.id && video.snippet) {
        allVideos.push({
          id: video.id,
          youtubeId: video.id,
          title: video.snippet.title || 'Unknown',
          channelTitle: video.snippet.channelTitle || 'Unknown',
          thumbnailUrl: video.snippet.thumbnails?.medium?.url || '',
          addedAt: new Date().toISOString(),
          comments: [],
          synced: true,
        });
      }
    }

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken); // 제한 없이 모든 페이지 가져오기

  return allVideos;
}

export function isAuthenticated(): boolean {
  return fs.existsSync(TOKEN_PATH);
}
