import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { VideoItem } from './youtube.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 빌드 후 dist/electron/services/ 에서 실행되므로 ../../../ 필요
const DATA_DIR = path.join(__dirname, '../../../data');
const MUSIC_FILE = path.join(DATA_DIR, 'music.json');
const BLACKLIST_FILE = path.join(DATA_DIR, 'blacklist.json');

export interface MusicData {
  items: VideoItem[];
  lastSync: string;
}

export interface BlacklistItem {
  youtubeId: string;
  deletedAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadMusicData(): MusicData {
  ensureDataDir();
  if (fs.existsSync(MUSIC_FILE)) {
    return JSON.parse(fs.readFileSync(MUSIC_FILE, 'utf8'));
  }
  return { items: [], lastSync: '' };
}

export function saveMusicData(data: MusicData): void {
  ensureDataDir();
  fs.writeFileSync(MUSIC_FILE, JSON.stringify(data, null, 2));
}

export function loadBlacklist(): BlacklistItem[] {
  ensureDataDir();
  if (fs.existsSync(BLACKLIST_FILE)) {
    return JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8'));
  }
  return [];
}

export function saveBlacklist(items: BlacklistItem[]): void {
  ensureDataDir();
  fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(items, null, 2));
}

export function addToBlacklist(youtubeId: string): void {
  const blacklist = loadBlacklist();
  if (!blacklist.find(item => item.youtubeId === youtubeId)) {
    blacklist.push({ youtubeId, deletedAt: new Date().toISOString() });
    saveBlacklist(blacklist);
  }
}

export function mergeVideos(existing: VideoItem[], newVideos: VideoItem[], blacklist: BlacklistItem[]): VideoItem[] {
  const blacklistIds = new Set(blacklist.map(b => b.youtubeId));
  const existingMap = new Map(existing.map(v => [v.youtubeId, v]));

  // 기존 데이터의 rating, comments 유지하면서 병합
  for (const video of newVideos) {
    if (blacklistIds.has(video.youtubeId)) continue;

    const existingVideo = existingMap.get(video.youtubeId);
    if (existingVideo) {
      // 기존 rating, comments 유지
      existingMap.set(video.youtubeId, {
        ...video,
        rating: existingVideo.rating,
        comments: existingVideo.comments,
        addedAt: existingVideo.addedAt,
      });
    } else {
      existingMap.set(video.youtubeId, video);
    }
  }

  return Array.from(existingMap.values());
}
