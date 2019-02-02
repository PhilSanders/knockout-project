// assets / js / index

const BrowserWindow = require('electron').remote.BrowserWindow
const remote = require('electron').remote
const { Menu, MenuItem } = remote
const mainProcess = remote.require('./main')
const path = require('path')
const store = require('electron-store')
const storage = new store()

const library = require(path.resolve('./assets/js/library'))
const Library = new library.Library

// app process feedback
const feedback = require(path.resolve('./assets/js/feedback'))
const updateConsole = feedback.updateConsole

// audio / visualizer
const audio = require(path.resolve('./assets/js/audio'))
const audioPlayer = audio.audioPlayer
const audioSource = audio.audioSource
const visualizer = audio.visualizer

audioPlayer.onended = () => {
  // get the next item in the playlist, if there is one
  const playlistData = Library.viewModel.playlistCoreData()

  if (playlistData.length > 1) {
    const nextItemId = Library.viewModel.currentAudioFile.id + 1;

    playlistData.forEach((item) => {
      if (item.id === nextItemId && item.id < playlistData.length - 1) {
        Library.viewModel.playThisItem(item, true)
      }
      else {
        updateConsole('<i class="glyphicon glyphicon-stop"></i> Ready')
      }
    })
  }
  else {
    updateConsole('<i class="glyphicon glyphicon-stop"></i> Ready')
  }
}

// buttons / inputs
const dirDialogBtn = document.querySelector('#DirInput')
dirDialogBtn.addEventListener('click', () => {
  mainProcess.selectDirectory((path) => {
    if (path) {
      storage.set('preferences.libraryPath', path[0])
      Library.updateLibPath()
    }
  })
})

const clearPlaylistBtn = document.querySelector('#ClearPlaylistBtn')
clearPlaylistBtn.addEventListener('click', () => {
  storage.set('playlist', [])
  Library.viewModel.playlistCoreData([])
})

const sufflePlaylistBtn = document.querySelector('#ShufflePlaylistBtn')
sufflePlaylistBtn.addEventListener('click', () => {
  let playlistData = Library.viewModel.playlistCoreData()

  if (playlistData.length) {
    playlistData.sort(() => { return 0.5 - Math.random() })

    playlistData = playlistData.map((item, index) => {
      item.id = index
      return item
    })

    storage.set('playlist', playlistData)
    Library.viewModel.playlistCoreData(playlistData)
  }
})

// context menus
let contextMenuRef; // this should always be a table row (tr) object

const libraryMenu = new Menu()
libraryMenu.append(new MenuItem({ label: 'Play', click() { menuPlayClicked() } }))
libraryMenu.append(new MenuItem({ label: 'Edit', click() { menuEditClicked() } }))
libraryMenu.append(new MenuItem({ type:  'separator' }))
libraryMenu.append(new MenuItem({ label: 'Add to Playlist', click() { menuAddPlaylistClicked() } }))
libraryMenu.append(new MenuItem({ type:  'separator' }))
libraryMenu.append(new MenuItem({ label: 'Favorite', type: 'checkbox', checked: false }))

const menuPlayClicked = () => {
  // resolves as Library.viewModel.libraryItemPlayClicked()
  contextMenuRef.children[0].children[0].click();
}

const menuEditClicked = () => {
  // resolves as Library.viewModel.editClicked()
  contextMenuRef.children[contextMenuRef.cells.length - 1].children[0].click();
}

const menuAddPlaylistClicked = () => {
  // resolves as Library.viewModel.addPlaylistClicked()
  contextMenuRef.children[contextMenuRef.cells.length - 1].children[1].click();
}

const playlistMenu = new Menu()
playlistMenu.append(new MenuItem({ label: 'Play', click() { menuPlaylistPlayClicked() } }))
playlistMenu.append(new MenuItem({ label: 'Edit', click() { menuPlaylistEditClicked() } }))
playlistMenu.append(new MenuItem({ type:  'separator' }))
playlistMenu.append(new MenuItem({ label: 'Remove from Playlist', click() { menuRemovePlaylistClicked() } }))
playlistMenu.append(new MenuItem({ type:  'separator' }))
playlistMenu.append(new MenuItem({ label: 'Favorite', type: 'checkbox', checked: false }))

const menuPlaylistPlayClicked = () => {
  // resolves as Library.viewModel.playlistItemPlayClicked()
  contextMenuRef.children[contextMenuRef.cells.length - 1].children[1].click();
}

const menuPlaylistEditClicked = () => {
  // resolves as Library.viewModel.editClicked()
  contextMenuRef.children[contextMenuRef.cells.length - 1].children[2].click();
}

const menuRemovePlaylistClicked = () => {
  // resolves as Library.viewModel.removeFromPlaylistClicked()
  contextMenuRef.children[contextMenuRef.cells.length - 1].children[3].click();
}

// watch for right clicks
window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  contentMenuRef = null;

  let libraryItem,
      playlistItem

  for(let i = 0; i < e.path.length; i++) {
    if (e.path[i].classList.contains('library-item')) {
      libraryItem = e.path[i];
      break;
    }
    if (e.path[i].classList.contains('playlist-item')) {
      playlistItem = e.path[i];
      break;
    }
  }

  if (libraryItem) {
    contextMenuRef = libraryItem
    libraryMenu.popup({ window: remote.getCurrentWindow() })
  }
  else if (playlistItem) {
    contextMenuRef = playlistItem
    playlistMenu.popup({ window: remote.getCurrentWindow() })
  }
}, false)

// start
Library.init(storage)
