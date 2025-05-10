import { app, BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import * as path from 'path';

function createWindow(): BrowserWindow {
  // force xwayland for transparency on Linux
  app.commandLine.appendSwitch('disable-features', 'useozoneplatform');
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

  const windowOpts: BrowserWindowConstructorOptions = {
    width: 400,
    height: 600,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
  };

  const win = new BrowserWindow(windowOpts);

  win.loadFile(path.join(__dirname, 'index.html'));
  win.setIgnoreMouseEvents(true, { forward: true });

  // auto-open DevTools so you can see console.log/debug()
  win.webContents.openDevTools({ mode: 'undocked' });

  // forward renderer logs to your terminal (optional)
  // win.webContents.on(
  //   'console-message',
  //   (e, level, message, line, sourceId) => {
  //     console.log(`[renderer] ${message} (${sourceId}:${line})`);
  //   }
  // );

  return win;
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
