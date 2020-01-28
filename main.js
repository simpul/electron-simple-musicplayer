const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const DataStore = require('./renderer/musicDataStore');
const myStore = new DataStore({name: 'music'})
class AppWindow extends BrowserWindow {
  constructor(config, fileLocation) {
    const finalConfig = { ...{
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: true
      }
    }, ...config }
    super(finalConfig);
    this.loadFile(fileLocation);
    this.once('ready-to-show', () => { // 页面内容渲染完后才显示
      this.show();
    })
  }
}

app.on('ready', () => {
  const mainWindow = new AppWindow({}, './renderer/index.html');
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.send('getTracks', myStore.getTracks())
  })
  ipcMain.on('add-music-window', () => {
    const addWindow = new AppWindow({
      width: 500,
      height: 400,
      parent: mainWindow
    }, './renderer/add.html');
  })

  ipcMain.on('open-music-file', (event) => {
    dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{name: 'Music', extensions: ['mp3']}]
    }).then(files => {
      if (files) {
        event.sender.send('selected-files', files.filePaths)
      }
    }).catch(error => {
      console.log(error)
    })
  })

  ipcMain.on('add-tracks', (event, tracks) => {
    const updatedTracks = myStore.addTracks(tracks).getTracks()
    mainWindow.send('getTracks', updatedTracks)
  }) 

  ipcMain.on('delete-track', (event, id) => {
    const updatedTracks = myStore.deleteTrack(id).getTracks();
    mainWindow.send('getTracks', updatedTracks)
  })
})