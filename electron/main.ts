import { app, BrowserWindow, BrowserWindowConstructorOptions, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow(): BrowserWindow {
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

  const windowOpts: BrowserWindowConstructorOptions = {
    width: 250,
    height: 350,
    x: screen.getPrimaryDisplay().workAreaSize.width - 270,
    y: screen.getPrimaryDisplay().workAreaSize.height - 370,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    closable: false,
    focusable: false,
    acceptFirstMouse: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
      preload: path.join(__dirname, '../electron/preload.js'),
    },
  };

  const win = new BrowserWindow(windowOpts);

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true);
  win.loadFile('dist/src/index.html');


  function moveModelRandomly() {
    const offsetX = (Math.random() - 0.5) * 200;
    const offsetY = (Math.random() - 0.5) * 200;
    win.webContents.send('move-model', { x: offsetX, y: offsetY });
  }

  function moveWindowRandomly() {
    const displays = screen.getAllDisplays();
    
    let minX = 0, minY = 0, maxX = 0, maxY = 0;
    displays.forEach(display => {
      const { x, y, width, height } = display.workArea;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });
    
    const windowBounds = win.getBounds();
    
    const padding = 20;
    const safeMinX = minX + padding;
    const safeMinY = minY + padding;
    const safeMaxX = maxX - windowBounds.width - padding;
    const safeMaxY = maxY - windowBounds.height - padding;
    
    const newX = safeMinX + Math.random() * (safeMaxX - safeMinX);
    const newY = safeMinY + Math.random() * (safeMaxY - safeMinY);
    
    const targetX = Math.floor(newX);
    const targetY = Math.floor(newY);
    
    exec('hyprctl -j clients', (error, stdout, stderr) => {
      if (error) {
        console.log('Failed to get window list');
        win.setPosition(targetX, targetY, false);
        return;
      }
      
      try {
        const clients = JSON.parse(stdout);
        const ourWindow = clients.find((client: any) => 
          client.class === 'vrm-desktop-pet' || 
          client.title.includes('three-vrm example')
        );
        
        if (ourWindow) {
          
          const currentX = ourWindow.at[0];
          const currentY = ourWindow.at[1];
          
          const relativeX = targetX - currentX;
          const relativeY = targetY - currentY;
          
          
          const hyprProcess = spawn('hyprctl', [
            'dispatch',
            'movewindowpixel',
            '--',
            `${relativeX} ${relativeY},class:vrm-desktop-pet`
          ]);
          
          let output = '';
          hyprProcess.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          hyprProcess.stderr.on('data', (data) => {
            output += data.toString();
          });
          
          hyprProcess.on('close', () => {});
        } else {
          win.setPosition(targetX, targetY, false);
        }
      } catch (parseError) {
        win.setPosition(targetX, targetY, false);
      }
    });
  }

  setInterval(moveModelRandomly, 3000);
  setInterval(moveWindowRandomly, 8000);

  win.webContents.openDevTools({ mode: 'undocked' });

  return win;
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
