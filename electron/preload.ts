import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // 나중에 IPC 통신용 메서드 추가
  platform: process.platform,
});
