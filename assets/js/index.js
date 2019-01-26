// assets / js / index

const BrowserWindow = require('electron').remote.BrowserWindow
const remote = require('electron').remote
const { Menu, MenuItem } = remote
const mainProcess = remote.require('./main')
const path = require('path')
const fastSort = require('fast-sort')
const store = require('electron-store')
const storage = new store()

const dir = require(path.resolve('./assets/js/dir'));
const id3 = require(path.resolve('./assets/js/id3'))

const LibCore = require(path.resolve('./assets/js/library'))
const Library = new LibCore.Library

const defaultLibPath = './mp3'
let libraryTempData = []
let libPathInput

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

const feedback = require(path.resolve('./assets/js/feedback'))
const updateConsole = feedback.updateConsole

const dirDialogBtn = document.querySelector('#DirInput')
dirDialogBtn.addEventListener('click', () => {
  mainProcess.selectDirectory((path) => {
    if (path) {
      storage.set('preferences.libraryPath', path[0])
      updateLibPath()
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

let contextMenuRef; // this should always be an html element (tr)

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

const waitFor = (ms) => new Promise(r => setTimeout(r, ms))

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

const progressBarHtml = '<div class="progress">'
                          + '<div id="ModalProgressBar" class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">'
                            + '<span></span>'
                          + '</div>'
                        + '</div>'

const updateLibPath = () => {
  console.log('update preferences')
  // const libraryData = storage.get('library')

  audioPlayer.pause()

  $('#modal .modal-title').html('Please wait...')
  $('#modal .modal-body').html('<p>Preparing system...</p>')
  $('#modal').modal('show')

  libPathInput = document.querySelector('#LibraryPath')
  libPathInput.innerHTML = storage.get('preferences.libraryPath')

  window.setTimeout(() => {
    dir.walkParallel(storage.get('preferences.libraryPath'), (err, results) => {
      if (err)
        throw err;

      results.forEach((filePath, id) => {
        const fileName = filePath.substr(filePath.lastIndexOf('\/') + 1, filePath.length)

        if (fileName.split('.').pop() === 'mp3') {
          const info = id3.get(filePath)

          libraryTempData.push({
            catNum: '',
            compilationId: null,
            artist: info.artist ? info.artist : '',
            title: info.title ? info.title : '',
            description: info.comment ? info.comment.text : '',
            genre: info.genre ? info.genre : '',
            bpm: info.bpm ? info.bpm : '',
            type: info.album ? 'Album' : 'Single',
            album: info.album ? info.album : '',
            cover: info.image ? info.image.imageBuffer : '',
            year: info.year ? info.year : '',
            copyright: info.copyright ? info.copyright : '',
            url: '',
            tags: [],
            fileBufferId: id,
            filePath: filePath,
            fileName: fileName
          })
        }
      })
      // console.log(libraryTempData);

      fastSort(libraryTempData).asc(u => u.artist)
      storage.set('library', libraryTempData)
      libraryTempData = []

      Library.filtersSetup(storage.get('library'))
      Library.librarySetup(storage.get('library'))
      Library.updateDisabledFlags()

      Library.viewModel.filteredLibrary(Library.viewModel.getFilteredLibrary())
      Library.viewModel.filterGroups(Library.viewModel.filterGroups())

      updateConsole('<i class="glyphicon glyphicon-stop"></i> Ready')
      $('#modal').modal('hide')
      $(window).trigger('resize')
    })
  }, 1000)
}

// initializ storage bins
if (!storage.get('library'))
  storage.set('library', [])

if (!storage.get('playlist'))
  storage.set('playlist', [])

if (!storage.get('lastPlayed'))
  storage.set('lastPlayed', {})

if (!storage.get('preferences.libraryPath'))
  storage.set('preferences', { 'libraryPath': defaultLibPath })


$('#modal .modal-title').html('Please wait...')
$('#modal .modal-body').html('<p>Preparing system...</p>')
$('#modal').modal('show')

window.setTimeout(() => {
  if (!storage.get('library').length) {
    dir.walkParallel(storage.get('preferences.libraryPath'), (err, results) => {
      if (err)
        throw err;

      results.forEach((filePath, id) => {
        const fileName = filePath.substr(filePath.lastIndexOf('\/') + 1, filePath.length)

        if (fileName.split('.').pop() === 'mp3') {
          const info = id3.get(filePath)

          libraryTempData.push({
            catNum: '',
            compilationId: null,
            artist: info.artist ? info.artist : '',
            title: info.title ? info.title : '',
            description: info.comment ? info.comment.text : '',
            genre: info.genre ? info.genre : '',
            bpm: info.bpm ? info.bpm : '',
            type: info.album ? 'Album' : 'Single',
            album: info.album ? info.album : '',
            cover: info.image ? info.image.imageBuffer : '',
            year: info.year ? info.year : '',
            copyright: info.copyright ? info.copyright : '',
            url: '',
            tags: [],
            fileBufferId: id,
            filePath: filePath,
            fileName: fileName
          })
        }
      })
      console.log(libraryTempData);

      fastSort(libraryTempData).asc(u => u.artist);
      storage.set('library', libraryTempData)
      libraryTempData = []

      Library.init(storage)
    })
  }
  else {
    Library.init(storage)
  }
}, 1000)
