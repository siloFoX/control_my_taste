export interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  addedAt: string; // 좋아요 누른 시간
  rating?: number;
  comments: string[];
  synced: boolean; // YouTube 좋아요 목록과 동기화 여부
  // 추가 상세 정보 (videos.list에서 조회)
  tags?: string[];
  duration?: string; // ISO 8601 형식 (PT5M47S)
  topics?: string[]; // Wikipedia URL 형식
  // Hype 기능
  hypeUp: number;
  hypeDown: number;
}

export interface MusicData {
  items: VideoItem[];
  lastSync: string;
}

export interface BlacklistItem {
  youtubeId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  deletedAt: string;
}

export interface Settings {
  keepUnlikedVideos: boolean | null;
}

// 검색 조건 타입
export type ConditionType = 'rating' | 'channel' | 'keyword' | 'comment' | 'tag' | 'hasComment' | 'hypeUp' | 'hypeDown';

export interface SearchCondition {
  type: ConditionType;
  value: string; // rating: "1-5" 또는 "unrated", channel/comment: 검색어, hasComment: "true"/"false", hype: ">=10"
}

export interface SearchTemplate {
  id: string;
  name: string;
  includeConditions: SearchCondition[];
  excludeConditions: SearchCondition[];
  createdAt: string;
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
      updateHype: (youtubeId: string, type: 'up' | 'down') => Promise<APIResponse>;
      deleteMusic: (youtubeId: string) => Promise<APIResponse>;
      keepMusic: (youtubeId: string) => Promise<APIResponse>; // 개별 항목 남기기 (synced 상태 유지)
      loadBlacklist: () => Promise<APIResponse<BlacklistItem[]>>;
      restoreFromBlacklist: (youtubeId: string) => Promise<APIResponse>;
      addComment: (youtubeId: string, comment: string) => Promise<APIResponse>;
      updateComment: (youtubeId: string, commentIndex: number, comment: string) => Promise<APIResponse>;
      deleteComment: (youtubeId: string, commentIndex: number) => Promise<APIResponse>;
      loadSettings: () => Promise<APIResponse<Settings>>;
      saveSettings: (settings: Settings) => Promise<APIResponse>;
      // 검색 템플릿
      loadTemplates: () => Promise<APIResponse<SearchTemplate[]>>;
      saveTemplate: (template: SearchTemplate) => Promise<APIResponse>;
      deleteTemplate: (templateId: string) => Promise<APIResponse>;
    };
  }
}

export {};
