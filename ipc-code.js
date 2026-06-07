
  ipcMain.on('open-consciousness-3d', () => {
    if (mainWindow) {
      mainWindow.loadURL(`http://127.0.0.1:`+port+`/consciousness-3d`)
    }
  })
