export interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  addedAt: string;
  rating?: number;
  comments: string[];
}

export interface MusicData {
  items: VideoItem[];
  lastSync: string;
}

export interface BlacklistItem {
  youtubeId: string;
  deletedAt: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

declare global {
  interface Window {
    electronAPI: {
      platform: string;
      syncYoutube: () => Promise<APIResponse<MusicData>>;
      loadMusic: () => Promise<APIResponse<MusicData>>;
      updateRating: (youtubeId: string, rating: number) => Promise<APIResponse>;
      deleteMusic: (youtubeId: string) => Promise<APIResponse>;
      loadBlacklist: () => Promise<APIResponse<BlacklistItem[]>>;
      restoreFromBlacklist: (youtubeId: string) => Promise<APIResponse>;
    };
  }
}

export {};
