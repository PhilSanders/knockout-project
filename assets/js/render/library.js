// assets / js / library

const remote = require('electron').remote
const mainProcess = remote.require('./main')
const path = require('path')
const ko = require('knockout')
const fastSort = require('fast-sort')
const mp3Duration = require('mp3-duration')

const dataUrl = require(path.resolve('./assets/js/base64'))
const id3 = require(path.resolve('./assets/js/id3'))

const feedback = require(path.resolve('./assets/js/render/feedback'))
const updateConsole = feedback.updateConsole

const audio = require(path.resolve('./assets/js/render/audio'))
const audioPlayer = audio.audioPlayer
const audioSource = audio.audioSource
const visualizer = audio.visualizer

let storage = {}
let currentAudioFile = {}

const sorterClicked = (sortType) => {
  switch(sortType) {
    case 'artists':
      fastSort(Library.viewModel.libraryCoreData).asc(u => u.artist);
      break;
    case 'titles':
      fastSort(Library.viewModel.libraryCoreData).asc(u => u.title);
      break;
    case 'genres':
      fastSort(Library.viewModel.libraryCoreData).asc(u => u.genre);
      break;
    case 'years':
      fastSort(Library.viewModel.libraryCoreData).asc(u => u.year);
      break;
  }
  Library.viewModel.filteredLibrary(Library.viewModel.getFilteredLibrary());
}

const writeId3Tag = (item) => {
  // console.log(item)

  //  Define the tags for your file using the ID (e.g. APIC) or the alias (see at bottom)
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

  let success = id3.update(tags, item.filePath) //  Returns true/false or, if buffer passed as file, the tagged buffer
}

const Library = function() {
  const libCore = this;

  libCore.viewModel = null

  libCore.libraryViewModel = function() {
    const libVM = this

    libVM.libraryCoreData = []

    libVM.playlistCoreData = ko.observableArray([])

    libVM.currentArtist = ko.observable()
    libVM.currentTitle = ko.observable()
    libVM.currentFile = ko.observable()

    libVM.filterGroups = ko.observableArray()
    libVM.filteredLibrary = ko.observableArray([])

    libVM.getFilterGroupAsList = () => {
      let filterGroupList = []

      for (let key in libCore.viewModel.filterGroups()) {
        filterGroupList.push({
          name: key,
          filters: libCore.viewModel.filterGroups()[key].all,
          selected: libCore.viewModel.filterGroups()[key].selected
        });
      }

      return filterGroupList
    }

    libVM.filterClicked = (filter) => {
      //console.log(filter);
      libCore.toggleFilter(filter)
      libVM.setItemFlags()
      libVM.filteredLibrary(libVM.getFilteredLibrary())

      $(window).trigger('resize');
      // console.log('filter');
    }

    libVM.setItemFlags = () => {
      libVM.libraryCoreData.forEach((item) => {
        item.active(false);
      });

      libVM.filteredLibrary().forEach((item) => {
        item.active(false);
      });
    }

    libVM.getFilteredLibrary = () => {
      let filteredLibrary = libVM.libraryCoreData;

      for (let key in libVM.filterGroups()) {
        filteredLibrary = libCore.filterByGroup(key, filteredLibrary);
      }

      return filteredLibrary;
    }

    libVM.playThisItem = (item, autoPlay) => {
      console.log(item)

      const promise = dataUrl.base64(item.filePath, 'audio/mp3');
      promise.then((fileBuffer) => {
        // update audio player artist and song tile text display
        libVM.currentArtist(item.artist)
        libVM.currentTitle(item.title)

        // load base64 audio buffer and play it
        audioSource.src = fileBuffer
        audioPlayer.load()
        if (autoPlay) audioPlayer.play()

        // update the currently playing item
        currentAudioFile = item;
        storage.set('lastPlayed', item)

        // set active item in playlist
        libVM.toggleActiveItemInPlaylist()

        // start the visualizer
        visualizer();
      })
    }

    libVM.toggleActiveItemInPlaylist = () => {
      let playlistData = libVM.playlistCoreData()

      playlistData.forEach((item) => {
        item.active(false)
        if (item.id === currentAudioFile.id && item.filePath === currentAudioFile.filePath)
          item.active(true)
      })

      libVM.playlistCoreData(playlistData)
    }

    libVM.libraryItemPlayClicked = (item) => {
      libVM.playlistCoreData([])
      libVM.addItemToPlaylist(item, true, true)
    }

    libVM.playlistItemPlayClicked = (item) => {
      libVM.playThisItem(item, true)
    }

    libVM.playClicked = () => {
      libVM.toggleActiveItemInPlaylist()
      audioPlayer.play();
    }

    libVM.pauseClicked = () => {
      audioPlayer.pause();
    }

    libVM.addPlaylistClicked = (item) => {
      libVM.addItemToPlaylist(item, false, false)
    }

    libVM.addItemToPlaylist = (item, autoPlay, active) => {
      let playlistData = libVM.playlistCoreData()

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
        libVM.playlistCoreData(playlistData)
        if (autoPlay) libVM.playThisItem(item, true)

        console.log(playlistData)
      });
    }

    libVM.removeFromPlaylistClicked = (item) => {
      libVM.removeFromPlaylist(item)
    }

    libVM.removeFromPlaylist = (item) => {
      let playlistData = libVM.playlistCoreData(),
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
      libVM.playlistCoreData(playlistDataFiltered)
    }

    libVM.editClicked = (item) => {
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
        console.log('updating item', item)

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
            writeId3Tag(itemInStorage);
          }
          return itemInStorage;
        })

        storage.set('library', storageUpdate)
        libCore.updateCallback(storageUpdate)

        $('#modal').modal('hide')
      })
    }
  }

  libCore.toggleFilter = (filter) => {
    const filterLabel = filter.label;
    filter.active(!filter.active());
    libCore.updateFilterSelection(libCore.viewModel.filterGroups()[filter.label].selected, filter);
    libCore.updateDisabledFlags();
  }

  libCore.enableFilter = (filter) => {
    filter.disabled(false);
  }

  libCore.disableFilter = (selectionArray, filter) => {
    filter.active(false);
    filter.disabled(true);
    libCore.updateFilterSelection(selectionArray, filter);
  }

  libCore.applyFilters = (filters, items) => {
    // pass if it passes any filter in filterGroup
    return items.filter((item) => {
      for (let i in filters) {
        const filterGroup = libCore.viewModel.filterGroups()[filters[i].label];

        if (filterGroup.filterMethod(filters[i], item)) {
          return true;
        }
      }
      return false;
    });
  }

  libCore.filterByGroup = (filterGroup, items) => {
    const activeFilters = libCore.viewModel.filterGroups()[filterGroup].selected();
    return activeFilters.length !== 0 ? libCore.applyFilters(activeFilters, items) : items;
  }

  libCore.updateFilterSelection = (selectionArray, item) => {
    if (item.active()) {
      selectionArray.push(item);
    }
    else {
      selectionArray.remove(item);
    }
  }

  libCore.updateDisabledFlagsInGroup = (filterGroupName) => {
    let filteredLibrary = libCore.viewModel.libraryCoreData;
    // apply all filters in other groups
    for (let key in libCore.viewModel.filterGroups()) {
      if (key !== filterGroupName) {
        filteredLibrary = libCore.filterByGroup(key, filteredLibrary);
      }
    }

    const filterGroup = libCore.viewModel.filterGroups()[filterGroupName];
    filterGroup.all.forEach((filter) => {
      // disable filter if applying it would result in an empty set
      const tempFilteredLibrary = libCore.applyFilters([filter], filteredLibrary);
      if (tempFilteredLibrary.length === 0) {
        libCore.disableFilter(filterGroup.selected, filter)
      } else {
        libCore.enableFilter(filter);
      }
    });
  }

  libCore.updateDisabledFlags = () => {
    for (let key in libCore.viewModel.filterGroups()) {
      libCore.updateDisabledFlagsInGroup(key);
    }
  }

  libCore.addFilterGroup = (name, filters, filterMethod) => {
    libCore.viewModel.filterGroups()[name] = {
      all: filters.map((filter) => {
        filter.label = name;
        filter.active = ko.observable(false);
        filter.disabled = ko.observable(false);
        return filter;
      }),
      selected: ko.observableArray([]),
      filterMethod: filterMethod
    };
  }

  libCore.getTypeFilters = (data) => {
    let typeFiltersArray = [];

    data.forEach((item) => {
      const filter = {
        value: item.type,
      };

      if (filter.value && typeFiltersArray.map((f) => { return f.value }).indexOf(filter.value) === -1) {
        typeFiltersArray.push(filter);
      }
    });

    return typeFiltersArray;
  }

  libCore.getAlbumFilters = (data) => {
    let albumFiltersArray = [];

    data.forEach((item) => {
      const filter = {
        value: item.album,
      };

      if (filter.value && albumFiltersArray.map((f) => { return f.value }).indexOf(filter.value) === -1) {
        albumFiltersArray.push(filter);
      }
    });

    return albumFiltersArray;
  }

  libCore.getYearFilters = (data) => {
    let yearFiltersArray = [];

    data.forEach((item) => {
      const filter = {
        value: item.year,
      };

      if (filter.value && yearFiltersArray.map((f) => { return f.value }).indexOf(filter.value) === -1) {
        yearFiltersArray.push(filter);
      }
    });

    return yearFiltersArray;
  }

  libCore.getGenreFilters = (data) => {
    let genreFiltersArray = [];

    data.forEach((item) => {
      const filter = {
        value: item.genre,
      };

      if (filter.value && genreFiltersArray.map((f) => { return f.value }).indexOf(filter.value) === -1) {
        genreFiltersArray.push(filter);
      }
    });

    return genreFiltersArray;
  }

  libCore.getTagFilters = (data) => {
    let tagFiltersArray = [];

    data.forEach((item) => {
      item.tags.forEach((tag) => {
        const filter = {
          value: tag,
        };

        if (tag && tagFiltersArray.map((f) => { return f.value }).indexOf(filter.value) === -1) {
          tagFiltersArray.push(filter);
        }
      });
    });

    return tagFiltersArray;
  }

  libCore.refreshTagFilters = (libraryData) => {
    const tagFilters = libCore.getTagFilters(libraryData);
    libCore.addFilterGroup('Tags', tagFilters, (filter, item) => {
      return item.tags.indexOf(filter.value) !== -1;
    });
    libCore.viewModel.filterGroups(libCore.viewModel.filterGroups())
  }

  libCore.filtersSetup = (libraryData) => {
    // setup filter groups

    const typeFilters = libCore.getTypeFilters(libraryData);
    libCore.addFilterGroup('Type', typeFilters, (filter, item) => {
      return item.type === filter.value;
    });

    const albumFilters = libCore.getAlbumFilters(libraryData);
    libCore.addFilterGroup('Album', albumFilters, (filter, item) => {
      return item.album === filter.value;
    });

    const yearFilters = libCore.getYearFilters(libraryData);
    libCore.addFilterGroup('Year', yearFilters, (filter, item) => {
      return item.year === filter.value;
    });

    const genreFilters = libCore.getGenreFilters(libraryData);
    libCore.addFilterGroup('Genre', genreFilters, (filter, item) => {
      return item.genre === filter.value;
    });

    const tagFilters = libCore.getTagFilters(libraryData);
    libCore.addFilterGroup('Tags', tagFilters, (filter, item) => {
      return item.tags.indexOf(filter.value) !== -1;
    });
  }

  libCore.playlistSetup = () => {
    let playlistData = storage.get('playlist')

    if (playlistData) {
      playlistData = playlistData.map((item) => {
        item.active = ko.observable(false)
        return item
      })

      libCore.viewModel.playlistCoreData(playlistData)
    }
  }

  libCore.lastPlayedSetup = () => {
    if (storage.get('lastPlayed')) {
      let lastPlayedItem = storage.get('lastPlayed')

      lastPlayedItem.active = ko.observable(true)
      libCore.viewModel.playThisItem(lastPlayedItem, false)
    }
  }

  libCore.librarySetup = (libraryData) => {
    // setup library core data
    libCore.viewModel.libraryCoreData = libraryData.map((item) => {
      item.active = ko.observable(true);
      return item;
    });

    libCore.viewModel.filteredLibrary(libCore.viewModel.getFilteredLibrary())
  }

  libCore.storeBase64 = (libraryData) => { // Asynchronous Process
    const progressBar = document.querySelector('#ModalProgressBar')
    const progressAmount = document.querySelector('#ModalProgressBar span')
    let finishedBuffers = []

    asyncForEach(libraryData, async (libItem, n) => {
      const promise = dataUrl.base64(libItem.filePath, 'audio/mp3');

      updateConsole('<i class="glyphicon glyphicon-refresh"></i> Reading: ' + libItem.filePath);

      promise.then((fileBuffer) => {
        // console.log('audio.' + libItem.fileBufferId)
        let key = libItem.fileBufferId;
        finishedBuffers.push({[key]: fileBuffer});

        const progressAmntDone = Math.floor(100 *  finishedBuffers.length / libraryData.length) + '%'
        progressAmount.innerHTML = progressAmntDone
        progressBar.style.width = progressAmntDone

        // console.log(progressBar.style.width);
        finishedBuffers.length === libraryData.length ? window.setTimeout(() => {
          // console.log(finishedBuffers);
          // storage.set('audio', finishedBuffers);
          // console.log(storage.get('audio'));
          updateConsole('<i class="glyphicon glyphicon-stop"></i> Ready');
          $('#modal').modal('hide');
        }, 3000) : null;
      })

      await waitFor(1000);
    })
  }

  libCore.updateCallback = (libraryData) => {
    console.log(libraryData);
    libCore.refreshTagFilters(libraryData)
    libCore.librarySetup(libraryData)
    libCore.updateDisabledFlags()
    $(window).trigger('resize');
    // console.log(storage.get('library'))
  }

  libCore.initCallback = (initStorage) => {
    storage = initStorage

    let libraryData = storage.get('library')

    libCore.filtersSetup(libraryData)
    libCore.librarySetup(libraryData)
    libCore.playlistSetup(libraryData)
    libCore.updateDisabledFlags()

    ko.applyBindings(libCore.viewModel, document.querySelector('#MusicLibrary'))
    // console.log(libCore.viewModel.filteredLibrary())

    // load preferences
    libPathInput = document.querySelector('#LibraryPath')
    libPathInput.innerHTML = storage.get('preferences.libraryPath')

    // front load audio files
    // $('#modal .modal-title').html('Please wait...')
    // $('#modal .modal-body').html('<p>Reading: ' + storage.get('preferences.libraryPath') + '</p>' + progressBarHtml)
    // $('#modal').modal('show')
    // libCore.storeBase64(libraryData) // TODO do more testing with storage, currently only for show...

    // sets up fixed position table header
    $(document).ready(() => {
      $('.table-fixed').tableFixedHeader({
        scrollContainer: '.scroll-area'
      })

      $('.table-fixed th a').on('click', (elm) => {
        sorterClicked(elm.currentTarget.dataset.sorter)
      })

      // load last played item
      if (storage.get('lastPlayed')) {
        libCore.lastPlayedSetup()
      }
    })

    updateConsole('<i class="glyphicon glyphicon-stop"></i> Ready');
    $('#modal').modal('hide')
  }

  libCore.init = (storage) => {
    libCore.viewModel = new libCore.libraryViewModel()
    libCore.initCallback(storage)
  }
}

module.exports = {
    Library: Library
}
