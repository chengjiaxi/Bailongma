
    {
      label: '3D 意识空间',
      click: () => {
        if (mainWindow) {
          mainWindow.loadURL(`http://127.0.0.1:`+port+`/consciousness-3d`)
          mainWindow.show()
          mainWindow.focus()
        }
      },
    },
    { type: 'separator' },