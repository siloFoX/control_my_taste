import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchLikedVideos, isAuthenticated } from './services/youtube.js';
import { loadMusicData, saveMusicData, loadBlacklist, saveBlacklist, addToBlacklist, mergeVideos } from './services/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('youtube:sync', async () => {
  try {
    if (!isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }

    const newVideos = await fetchLikedVideos(100);
    const musicData = loadMusicData();
    const blacklist = loadBlacklist();

    const mergedItems = mergeVideos(musicData.items, newVideos, blacklist);

    const updatedData = {
      items: mergedItems,
      lastSync: new Date().toISOString(),
    };

    saveMusicData(updatedData);

    return { success: true, data: updatedData };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('music:load', async () => {
  try {
    const data = loadMusicData();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('music:updateRating', async (_event, youtubeId: string, rating: number) => {
  try {
    const musicData = loadMusicData();
    const item = musicData.items.find(v => v.youtubeId === youtubeId);
    if (item) {
      item.rating = rating;
      saveMusicData(musicData);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('music:delete', async (_event, youtubeId: string) => {
  try {
    const musicData = loadMusicData();
    musicData.items = musicData.items.filter(v => v.youtubeId !== youtubeId);
    saveMusicData(musicData);
    addToBlacklist(youtubeId);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('blacklist:load', async () => {
  try {
    const data = loadBlacklist();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('blacklist:restore', async (_event, youtubeId: string) => {
  try {
    const blacklist = loadBlacklist();
    const updated = blacklist.filter(item => item.youtubeId !== youtubeId);
    saveBlacklist(updated);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('music:addComment', async (_event, youtubeId: string, comment: string) => {
  try {
    const musicData = loadMusicData();
    const item = musicData.items.find(v => v.youtubeId === youtubeId);
    if (item) {
      item.comments.push(comment);
      saveMusicData(musicData);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('music:deleteComment', async (_event, youtubeId: string, commentIndex: number) => {
  try {
    const musicData = loadMusicData();
    const item = musicData.items.find(v => v.youtubeId === youtubeId);
    if (item && item.comments[commentIndex] !== undefined) {
      item.comments.splice(commentIndex, 1);
      saveMusicData(musicData);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});
