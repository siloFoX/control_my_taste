import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // YouTube 동기화
  syncYoutube: () => ipcRenderer.invoke('youtube:sync'),

  // 음악 데이터
  loadMusic: () => ipcRenderer.invoke('music:load'),
  updateRating: (youtubeId: string, rating: number) =>
    ipcRenderer.invoke('music:updateRating', youtubeId, rating),
  deleteMusic: (youtubeId: string) =>
    ipcRenderer.invoke('music:delete', youtubeId),

  // 블랙리스트 (휴지통)
  loadBlacklist: () => ipcRenderer.invoke('blacklist:load'),
  restoreFromBlacklist: (youtubeId: string) =>
    ipcRenderer.invoke('blacklist:restore', youtubeId),
});
