// assets / js / library

const remote = require('electron').remote
const mainProcess = remote.require('./main')
const path = require('path')
const ko = require('knockout')
const fastSort = require('fast-sort')
const mp3Duration = require('mp3-duration')

const dataUrl = require(path.resolve('./assets/js/base64'))
const id3 = require(path.resolve('./assets/js/id3'))

const feedback = require(path.resolve('./assets/js/feedback'))
const updateConsole = feedback.updateConsole

const audio = require(path.resolve('./assets/js/audio'))
const audioPlayer = audio.audioPlayer
const audioSource = audio.audioSource
const visualizer = audio.visualizer

let storage = {} // this gets set at initCallback(storageFromIndex)

const waitFor = (ms) => new Promise(r => setTimeout(r, ms))

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

const progressBarHtml = '<div class="progress">'
                          + '<div id="ModalProgressBar" class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">'
                            + '<span></span>'
                          + '</div>'
                        + '</div>'

const Library = function() {
  const self = this

  self.viewModel = null

  self.libraryVM = function() {
    this.libraryCoreData = []

    this.playlistCoreData = ko.observableArray([])

    this.currentArtist = ko.observable()
    this.currentTitle = ko.observable()
    this.currentFile = ko.observable()

    this.filterGroups = ko.observableArray()
    this.filteredLibrary = ko.observableArray([])

    this.getFilterGroupAsList = () => {
      let filterGroupList = []

      for (let key in self.viewModel.filterGroups()) {
        filterGroupList.push({
          name: key,
          filters: self.viewModel.filterGroups()[key].all,
          selected: self.viewModel.filterGroups()[key].selected
        })
      }

      return filterGroupList
    }

    this.filterClicked = (filter) => {
      //console.log(filter);
      self.toggleFilter(filter)
      this.setItemFlags()
      this.filteredLibrary(this.getFilteredLibrary())

      $(window).trigger('resize');
      // console.log('filter');
    }

    this.setItemFlags = () => {
      this.libraryCoreData.forEach((item) => {
        item.active(false)
      })

      this.filteredLibrary().forEach((item) => {
        item.active(false)
      })
    }

    this.getFilteredLibrary = () => {
      let filteredLibrary = this.libraryCoreData

      for (let key in this.filterGroups()) {
        filteredLibrary = self.filterByGroup(key, filteredLibrary)
      }

      return filteredLibrary
    }

    this.sorterClicked = (sortType) => {
      switch(sortType) {
        case 'artists':
          fastSort(this.libraryCoreData).asc(u => u.artist)
          break
        case 'titles':
          fastSort(this.libraryCoreData).asc(u => u.title)
          break
        case 'genres':
          fastSort(this.libraryCoreData).asc(u => u.genre)
          break
        case 'years':
          fastSort(this.libraryCoreData).asc(u => u.year)
          break
      }
      this.filteredLibrary(this.getFilteredLibrary())
    }

    this.currentAudioFile = {}

    this.playThisItem = (item, autoPlay) => {
      const promise = dataUrl.base64(item.filePath, 'audio/mp3')

      promise.then((fileBuffer) => {
        // update audio player artist and song tile text display
        this.currentArtist(item.artist)
        this.currentTitle(item.title)

        // load base64 audio buffer and play it
        audioSource.src = fileBuffer
        audioPlayer.load()
        if (autoPlay) audioPlayer.play()

        // update the currently playing item
        this.currentAudioFile = item;
        storage.set('lastPlayed', item)

        // set active item in playlist
        this.toggleActiveItemInPlaylist()

        // start the visualizer
        visualizer()
      })
    }

    this.toggleActiveItemInPlaylist = () => {
      let playlistData = this.playlistCoreData()

      playlistData.forEach((item) => {
        item.active(false)
        if (item.id === this.currentAudioFile.id && item.filePath === this.currentAudioFile.filePath)
          item.active(true)
      })

      this.playlistCoreData(playlistData)
    }

    this.libraryItemPlayClicked = (item) => {
      this.playlistCoreData([])
      this.addItemToPlaylist(item, true, true)
    }

    this.playlistItemPlayClicked = (item) => {
      this.playThisItem(item, true)
    }

    this.playClicked = () => {
      this.toggleActiveItemInPlaylist()
      audioPlayer.play()
    }

    this.pauseClicked = () => {
      audioPlayer.pause()
    }

    this.addPlaylistClicked = (item) => {
      this.addItemToPlaylist(item, false, false)
    }

    this.addItemToPlaylist = (item, autoPlay, active) => {
      let playlistData = this.playlistCoreData()

      mp3Duration(item.filePath, (err, duration) => {
        if (err) return console.log(err.message)

        let durmins = Math.floor(duration / 60)
        let dursecs = Math.floor(duration - durmins * 60)

        if (durmins < 10) { durmins = '0' + durmins; }
        if (dursecs < 10) { dursecs = '0' + dursecs; }

        item.id = playlistData.length + 1
        item.time = durmins + ':' + dursecs
        item.active(active)

        playlistData.push(item)

        storage.set('playlist', playlistData)
        this.playlistCoreData(playlistData)
        if (autoPlay) this.playThisItem(item, true)

        console.log(playlistData)
      })
    }

    this.removeFromPlaylistClicked = (item) => {
      this.removeFromPlaylist(item)
    }

    this.removeFromPlaylist = (item) => {
      let playlistData = this.playlistCoreData(),
          playlistDataFiltered = []

      playlistData.map((i) => {
        if (i.id !== item.id)
          playlistDataFiltered.push(i)
      })

      playlistDataFiltered = playlistDataFiltered.map((item, index) => {
        item.id = index
        return item
      })

      console.log(playlistDataFiltered);
      storage.set('playlist', playlistDataFiltered)
      this.playlistCoreData(playlistDataFiltered)
    }

    this.editClicked = (item) => {
      // console.log(item)
      $('#modal .modal-title').html('Edit Info')
      $('#modal .modal-body').html(id3.editorTemplate(item))
      $('#modal').modal('show')

      const fileDialogBtn = document.querySelector('#FileBtn')
      const coverInput = document.querySelector('#CoverInput')
      const coverImg = document.querySelector('#CoverImage')

      if (item.cover) {
        console.log(item.cover);
        const arrayBuffer = id3.get(item.filePath).image.imageBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        coverImg.src = 'data:image/png;base64,' + dataUrl.encode(bytes)
      }

      fileDialogBtn.addEventListener('click', (e) => {
        e.preventDefault()

        mainProcess.selectImage((filePaths) => {
          coverInput.value = filePaths ? filePaths[0] : ''
        })
      })

      $(() => {
        $('[data-toggle="tooltip"]').tooltip()
      })

      const id3UForm = document.querySelector('#Id3EditorForm')
      const id3UpdateBtn = document.querySelector('#Id3UpdateBtn')

      id3UpdateBtn.addEventListener('click', () => {
        const storageData = storage.get('library')
        const storageUpdate = storageData.map((itemInStorage) => {
          if (JSON.stringify(itemInStorage) === JSON.stringify(item)) {
            itemInStorage.artist      = id3UForm.ArtistInput.value ? id3UForm.ArtistInput.value : ''
            itemInStorage.title       = id3UForm.TitleInput.value ? id3UForm.TitleInput.value : ''
            itemInStorage.album       = id3UForm.AlbumInput.value ? id3UForm.AlbumInput.value : ''
            itemInStorage.cover       = id3UForm.CoverInput.value ? id3UForm.CoverInput.value : ''
            itemInStorage.year        = id3UForm.YearInput.value ? id3UForm.YearInput.value : ''
            itemInStorage.copyright   = id3UForm.CopyrightInput.value ? id3UForm.CopyrightInput.value : ''
            itemInStorage.url         = id3UForm.UrlInput.value ? id3UForm.UrlInput.value : ''
            itemInStorage.description = id3UForm.DescInput.value ? id3UForm.DescInput.value : ''
            itemInStorage.genre       = id3UForm.GenreInput.value ? id3UForm.GenreInput.value : ''
            itemInStorage.bpm         = id3UForm.BpmInput.value ? id3UForm.BpmInput.value : ''
            if (id3UForm.TagsInput.value) {
              const tagsStr = id3UForm.TagsInput.value.replace(/,\s*$/, ""),
                    tagsArray = tagsStr.split(',');

              itemInStorage.tags = tagsArray ? tagsArray : []
            }
            // also write the id3 tag
            self.writeId3TagInfo(itemInStorage)
          }

          return itemInStorage
        })

        storage.set('library', storageUpdate)
        self.updateCallback(storageUpdate)

        $('#modal').modal('hide')
      })
    }
  }

  self.writeId3TagInfo = (item) => {
    let tags = {
      artist: item.artist,
      title: item.title,
      album: item.album,
      year: item.year,
      copyright: item.copyright,
      url: item.url,
      comment: {
        text: item.description
      },
      genre: item.genre,
      bpm: item.bpm,
      APIC: item.cover,
      // TRCK: "27"
    }

    let success = id3.update(tags, item.filePath)
  }

  self.toggleFilter = (filter) => {
    const filterLabel = filter.label
    filter.active(!filter.active())
    self.updateFilterSelection(self.viewModel.filterGroups()[filter.label].selected, filter)
    self.updateDisabledFlags()
  }

  self.enableFilter = (filter) => {
    filter.disabled(false)
  }

  self.disableFilter = (selectionArray, filter) => {
    filter.active(false)
    filter.disabled(true)
    self.updateFilterSelection(selectionArray, filter)
  }

  self.applyFilters = (filters, items) => {
    // pass if it passes any filter in filterGroup
    return items.filter((item) => {
      for (let i in filters) {
        const filterGroup = self.viewModel.filterGroups()[filters[i].label]

        if (filterGroup.filterMethod(filters[i], item)) {
          return true
        }
      }
      return false
    })
  }

  self.filterByGroup = (filterGroup, items) => {
    const activeFilters = self.viewModel.filterGroups()[filterGroup].selected()
    return activeFilters.length !== 0 ? self.applyFilters(activeFilters, items) : items
  }

  self.updateFilterSelection = (selectionArray, item) => {
    if (item.active()) {
      selectionArray.push(item)
    }
    else {
      selectionArray.remove(item)
    }
  }

  self.updateDisabledFlagsInGroup = (filterGroupName) => {
    let filteredLibrary = self.viewModel.libraryCoreData
    // apply all filters in other groups
    for (let key in self.viewModel.filterGroups()) {
      if (key !== filterGroupName) {
        filteredLibrary = self.filterByGroup(key, filteredLibrary)
      }
    }

    const filterGroup = self.viewModel.filterGroups()[filterGroupName]
    filterGroup.all.forEach((filter) => {
      // disable filter if applying it would result in an empty set
      const tempFilteredLibrary = self.applyFilters([filter], filteredLibrary)
      if (tempFilteredLibrary.length === 0) {
        self.disableFilter(filterGroup.selected, filter)
      } else {
        self.enableFilter(filter)
      }
    })
  }

  self.updateDisabledFlags = () => {
    for (let key in self.viewModel.filterGroups()) {
      self.updateDisabledFlagsInGroup(key)
    }
  }

  self.addFilterGroup = (name, filters, filterMethod) => {
    self.viewModel.filterGroups()[name] = {
      all: filters.map((filter) => {
        filter.label = name
        filter.active = ko.observable(false)
        filter.disabled = ko.observable(false)
        return filter
      }),
      selected: ko.observableArray([]),
      filterMethod: filterMethod
    }
  }

  self.getTypeFilters = (data) => {
    let typeFiltersArray = []

    data.forEach((item) => {
      const filter = {
        value: item.type
      }

      if (filter.value && typeFiltersArray.map((f) => { return f.value }).indexOf(filter.value) === -1) {
        typeFiltersArray.push(filter)
      }
    })

    return typeFiltersArray
  }

  self.getAlbumFilters = (data) => {
    let albumFiltersArray = []

    data.forEach((item) => {
      const filter = {
        value: item.album
      }

      if (filter.value && albumFiltersArray.map((f) => { return f.value }).indexOf(filter.value) === -1) {
        albumFiltersArray.push(filter)
      }
    })

    return albumFiltersArray
  }

  self.getYearFilters = (data) => {
    let yearFiltersArray = []

    data.forEach((item) => {
      const filter = {
        value: item.year
      }

      if (filter.value && yearFiltersArray.map((f) => { return f.value }).indexOf(filter.value) === -1) {
        yearFiltersArray.push(filter)
      }
    })

    return yearFiltersArray
  }

  self.getGenreFilters = (data) => {
    let genreFiltersArray = []

    data.forEach((item) => {
      const filter = {
        value: item.genre
      }

      if (filter.value && genreFiltersArray.map((f) => { return f.value }).indexOf(filter.value) === -1) {
        genreFiltersArray.push(filter)
      }
    })

    return genreFiltersArray
  }

  self.getTagFilters = (data) => {
    let tagFiltersArray = []

    data.forEach((item) => {
      item.tags.forEach((tag) => {
        const filter = {
          value: tag
        }

        if (tag && tagFiltersArray.map((f) => { return f.value }).indexOf(filter.value) === -1) {
          tagFiltersArray.push(filter)
        }
      })
    })

    return tagFiltersArray
  }

  self.refreshTagFilters = (libraryData) => {
    const tagFilters = self.getTagFilters(libraryData)
    self.addFilterGroup('Tags', tagFilters, (filter, item) => {
      return item.tags.indexOf(filter.value) !== -1
    })
    self.viewModel.filterGroups(self.viewModel.filterGroups())
  }

  self.filtersSetup = (libraryData) => {
    // setup filter groups

    const typeFilters = self.getTypeFilters(libraryData)
    self.addFilterGroup('Type', typeFilters, (filter, item) => {
      return item.type === filter.value
    })

    const albumFilters = self.getAlbumFilters(libraryData)
    self.addFilterGroup('Album', albumFilters, (filter, item) => {
      return item.album === filter.value
    })

    const yearFilters = self.getYearFilters(libraryData)
    self.addFilterGroup('Year', yearFilters, (filter, item) => {
      return item.year === filter.value
    })

    const genreFilters = self.getGenreFilters(libraryData)
    self.addFilterGroup('Genre', genreFilters, (filter, item) => {
      return item.genre === filter.value
    })

    const tagFilters = self.getTagFilters(libraryData)
    self.addFilterGroup('Tags', tagFilters, (filter, item) => {
      return item.tags.indexOf(filter.value) !== -1
    })
  }

  self.playlistSetup = () => {
    let playlistData = storage.get('playlist')

    if (playlistData) {
      playlistData = playlistData.map((item) => {
        item.active = ko.observable(false)
        return item
      })

      self.viewModel.playlistCoreData(playlistData)
    }
  }

  self.lastPlayedSetup = () => {
    if (storage.get('lastPlayed')) {
      let lastPlayedItem = storage.get('lastPlayed')

      lastPlayedItem.active = ko.observable(true)
      self.viewModel.playThisItem(lastPlayedItem, false)
    }
  }

  self.librarySetup = (libraryData) => {
    // setup library core data
    self.viewModel.libraryCoreData = libraryData.map((item) => {
      item.active = ko.observable(true);
      return item
    });

    self.viewModel.filteredLibrary(self.viewModel.getFilteredLibrary())
  }

  self.storeBase64 = (libraryData) => { // Asynchronous Process
    const progressBar = document.querySelector('#ModalProgressBar')
    const progressAmount = document.querySelector('#ModalProgressBar span')
    let finishedBuffers = []

    asyncForEach(libraryData, async (libItem, n) => {
      const promise = dataUrl.base64(libItem.filePath, 'audio/mp3')

      updateConsole('<i class="glyphicon glyphicon-refresh"></i> Reading: ' + libItem.filePath)

      promise.then((fileBuffer) => {
        let key = libItem.fileBufferId
        finishedBuffers.push({[key]: fileBuffer})

        const progressAmntDone = Math.floor(100 *  finishedBuffers.length / libraryData.length) + '%'
        progressAmount.innerHTML = progressAmntDone
        progressBar.style.width = progressAmntDone

        // console.log(progressBar.style.width);
        finishedBuffers.length === libraryData.length ? window.setTimeout(() => {
          // console.log(finishedBuffers);
          // storage.set('audio', finishedBuffers);
          // console.log(storage.get('audio'));
          updateConsole('<i class="glyphicon glyphicon-stop"></i> Ready')
          $('#modal').modal('hide')
        }, 3000) : null
      })

      await waitFor(1000)
    })
  }

  self.updateCallback = (libraryData) => {
    self.refreshTagFilters(libraryData)
    self.librarySetup(libraryData)
    self.updateDisabledFlags()
    $(window).trigger('resize')
    // console.log(storage.get('library'))
  }

  self.initSetup = (storageFromIndex) => {
    storage = storageFromIndex

    let libraryData = storage.get('library')

    self.filtersSetup(libraryData)
    self.librarySetup(libraryData)
    self.playlistSetup(libraryData)
    self.updateDisabledFlags()

    ko.applyBindings(self.viewModel, document.querySelector('#MusicLibrary'))

    // load preferences
    libPathInput = document.querySelector('#LibraryPath')
    libPathInput.innerHTML = storage.get('preferences.libraryPath')

    // front load audio files
    // $('#modal .modal-title').html('Please wait...')
    // $('#modal .modal-body').html('<p>Reading: ' + storage.get('preferences.libraryPath') + '</p>' + progressBarHtml)
    // $('#modal').modal('show')
    // self.storeBase64(libraryData) // TODO do more testing with storage, currently only for show...

    // sets up fixed position table header
    $(document).ready(() => {
      $('.table-fixed').tableFixedHeader({
        scrollContainer: '.scroll-area'
      })

      $('.table-fixed th a').on('click', (elm) => {
        self.viewModel.sorterClicked(elm.currentTarget.dataset.sorter)
      })

      // load last played item
      if (storage.get('lastPlayed')) {
        self.lastPlayedSetup()
      }
    })

    updateConsole('<i class="glyphicon glyphicon-stop"></i> Ready')
    $('#modal').modal('hide')
  }

  self.init = (storageFromIndex) => {
    self.viewModel = new self.libraryVM()
    self.initSetup(storageFromIndex)
  }
}

module.exports = {
    Library: Library
}
