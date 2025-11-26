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
  tags?: string[];
  duration?: string;
  topics?: string[];
  hypeUp: number;
  hypeDown: number;
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

// playlistItems.list로 좋아요 목록 전체 가져오기 (999개 제한 없음)
export async function fetchAllLikedVideos(): Promise<VideoItem[]> {
  const auth = getOAuth2Client();
  const youtube = google.youtube({ version: 'v3', auth });

  const allVideos: VideoItem[] = [];
  let pageToken: string | undefined;

  do {
    const response = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: 'LL', // Liked List
      maxResults: 50,
      pageToken,
    });

    const items = response.data.items || [];

    for (const item of items) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (videoId && item.snippet) {
        allVideos.push({
          id: videoId,
          youtubeId: videoId,
          title: item.snippet.title || 'Unknown',
          channelTitle: item.snippet.videoOwnerChannelTitle || 'Unknown',
          thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
          addedAt: item.snippet.publishedAt || new Date().toISOString(), // 좋아요 누른 시간
          comments: [],
          synced: true,
          hypeUp: 0,
          hypeDown: 0,
        });
      }
    }

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return allVideos;
}

// videoId 목록으로 상세 정보 조회 (tags, duration, topics)
export async function fetchVideoDetails(videoIds: string[]): Promise<Map<string, { tags?: string[]; duration?: string; topics?: string[] }>> {
  const auth = getOAuth2Client();
  const youtube = google.youtube({ version: 'v3', auth });

  const detailsMap = new Map<string, { tags?: string[]; duration?: string; topics?: string[] }>();

  // 50개씩 나눠서 조회
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);

    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'topicDetails'],
      id: chunk,
    });

    const videos = response.data.items || [];

    for (const video of videos) {
      if (video.id) {
        detailsMap.set(video.id, {
          tags: video.snippet?.tags || undefined,
          duration: video.contentDetails?.duration || undefined,
          topics: video.topicDetails?.topicCategories || undefined,
        });
      }
    }
  }

  return detailsMap;
}

export function isAuthenticated(): boolean {
  return fs.existsSync(TOKEN_PATH);
}
