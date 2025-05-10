import { app, BrowserWindow, BrowserWindowConstructorOptions } from 'electron';

function createWindow(): BrowserWindow {
  // force xwayland for transparency on Linux
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

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile('dist/src/index.html');
  }


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
