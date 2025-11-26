import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // YouTube 동기화
  syncYoutube: () => ipcRenderer.invoke('youtube:sync'),
  confirmSync: (action: 'keep_all' | 'delete_all' | 'individual') =>
    ipcRenderer.invoke('youtube:confirmSync', action),

  // 음악 데이터
  loadMusic: () => ipcRenderer.invoke('music:load'),
  updateRating: (youtubeId: string, rating: number) =>
    ipcRenderer.invoke('music:updateRating', youtubeId, rating),
  updateHype: (youtubeId: string, type: 'up' | 'down') =>
    ipcRenderer.invoke('music:updateHype', youtubeId, type),
  deleteMusic: (youtubeId: string) =>
    ipcRenderer.invoke('music:delete', youtubeId),
  keepMusic: (youtubeId: string) =>
    ipcRenderer.invoke('music:keep', youtubeId),

  // 블랙리스트 (휴지통)
  loadBlacklist: () => ipcRenderer.invoke('blacklist:load'),
  restoreFromBlacklist: (youtubeId: string) =>
    ipcRenderer.invoke('blacklist:restore', youtubeId),

  // 코멘트
  addComment: (youtubeId: string, comment: string) =>
    ipcRenderer.invoke('music:addComment', youtubeId, comment),
  updateComment: (youtubeId: string, commentIndex: number, comment: string) =>
    ipcRenderer.invoke('music:updateComment', youtubeId, commentIndex, comment),
  deleteComment: (youtubeId: string, commentIndex: number) =>
    ipcRenderer.invoke('music:deleteComment', youtubeId, commentIndex),

  // 설정
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: { keepUnlikedVideos: boolean | null }) =>
    ipcRenderer.invoke('settings:save', settings),

  // 검색 템플릿
  loadTemplates: () => ipcRenderer.invoke('templates:load'),
  saveTemplate: (template: {
    id: string;
    name: string;
    includeConditions: { type: string; value: string }[];
    excludeConditions: { type: string; value: string }[];
    createdAt: string;
  }) => ipcRenderer.invoke('templates:save', template),
  deleteTemplate: (templateId: string) =>
    ipcRenderer.invoke('templates:delete', templateId),
});
