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
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

export interface Settings {
  keepUnlikedVideos: boolean | null; // null = 아직 선택 안함, true = 남기기, false = 삭제
}

const DEFAULT_SETTINGS: Settings = {
  keepUnlikedVideos: null,
};

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

export function loadSettings(): Settings {
  ensureDataDir();
  if (fs.existsSync(SETTINGS_FILE)) {
    const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    return { ...DEFAULT_SETTINGS, ...saved };
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: Settings): void {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export interface SyncResult {
  items: VideoItem[];
  added: VideoItem[];
  unsynced: VideoItem[]; // 좋아요 해제된 항목들 (synced: false로 표시됨)
}

// 동기화: synced 상태 업데이트, 좋아요 해제 항목은 synced: false로 표시
export function mergeVideos(
  existing: VideoItem[],
  newVideos: VideoItem[],
  blacklist: BlacklistItem[]
): SyncResult {
  const blacklistIds = new Set(blacklist.map(b => b.youtubeId));
  const newVideoIds = new Set(newVideos.map(v => v.youtubeId));
  const existingMap = new Map(existing.map(v => [v.youtubeId, v]));

  const added: VideoItem[] = [];
  const unsynced: VideoItem[] = [];

  // 좋아요 해제된 항목 감지 -> synced: false로 표시
  for (const video of existing) {
    if (!newVideoIds.has(video.youtubeId) && !blacklistIds.has(video.youtubeId)) {
      // 이미 synced: false인 항목은 다시 추가하지 않음
      if (video.synced !== false) {
        const unsyncedVideo = { ...video, synced: false };
        existingMap.set(video.youtubeId, unsyncedVideo);
        unsynced.push(unsyncedVideo);
      }
    }
  }

  // 새로운 항목 추가 (기존 데이터의 rating, comments 유지)
  for (const video of newVideos) {
    if (blacklistIds.has(video.youtubeId)) continue;

    const existingVideo = existingMap.get(video.youtubeId);
    if (existingVideo) {
      // 기존 rating, comments 유지, synced: true로 업데이트
      existingMap.set(video.youtubeId, {
        ...video,
        rating: existingVideo.rating,
        comments: existingVideo.comments,
        addedAt: existingVideo.addedAt,
        synced: true,
      });
    } else {
      added.push(video);
      existingMap.set(video.youtubeId, video);
    }
  }

  return {
    items: Array.from(existingMap.values()),
    added,
    unsynced,
  };
}

// 일괄 처리: 모든 unsynced 항목 삭제
export function deleteAllUnsynced(musicData: MusicData): MusicData {
  return {
    ...musicData,
    items: musicData.items.filter(item => item.synced !== false),
  };
}

// 개별 항목 남기기 확정 (synced 상태 유지, 더 이상 unsynced로 표시 안 함)
export function keepItem(musicData: MusicData, youtubeId: string): MusicData {
  return {
    ...musicData,
    items: musicData.items.map(item =>
      item.youtubeId === youtubeId ? { ...item, synced: true } : item
    ),
  };
}
