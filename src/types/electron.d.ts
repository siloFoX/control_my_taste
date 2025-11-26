export interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  addedAt: string;
  rating?: number;
  comments: string[];
  synced: boolean; // YouTube 좋아요 목록과 동기화 여부
}

export interface MusicData {
  items: VideoItem[];
  lastSync: string;
}

export interface BlacklistItem {
  youtubeId: string;
  deletedAt: string;
}

export interface Settings {
  keepUnlikedVideos: boolean | null;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SyncResponse extends APIResponse<MusicData> {
  needsConfirmation?: boolean;
  unsynced?: VideoItem[]; // 좋아요 해제된 항목 (synced: false)
  added?: VideoItem[];
  totalFetched?: number;
}

declare global {
  interface Window {
    electronAPI: {
      platform: string;
      syncYoutube: () => Promise<SyncResponse>;
      confirmSync: (action: 'keep_all' | 'delete_all' | 'individual') => Promise<SyncResponse>;
      loadMusic: () => Promise<APIResponse<MusicData>>;
      updateRating: (youtubeId: string, rating: number) => Promise<APIResponse>;
      deleteMusic: (youtubeId: string) => Promise<APIResponse>;
      keepMusic: (youtubeId: string) => Promise<APIResponse>; // 개별 항목 남기기 (synced 상태 유지)
      loadBlacklist: () => Promise<APIResponse<BlacklistItem[]>>;
      restoreFromBlacklist: (youtubeId: string) => Promise<APIResponse>;
      addComment: (youtubeId: string, comment: string) => Promise<APIResponse>;
      deleteComment: (youtubeId: string, commentIndex: number) => Promise<APIResponse>;
      loadSettings: () => Promise<APIResponse<Settings>>;
      saveSettings: (settings: Settings) => Promise<APIResponse>;
    };
  }
}

export {};
