// index.js

const BrowserWindow = require('electron').remote.BrowserWindow
const remote = require('electron').remote
const { Menu, MenuItem } = remote
const ko = require('knockout')
const mainProcess = remote.require('./main')
const dir = remote.require('./assets/js/dir')
const sort = remote.require('./assets/js/sort')
const dataUrl = remote.require('./assets/js/base64')
const id3 = remote.require('./assets/js/id3')
const store = require('electron-store')
const storage = new store()

let libraryTempData = []
let libPath = 'assets/mp3'

let audioPlayer = document.querySelector('#AudioPlayer')
let audioSource = document.querySelector('#AudioMp3')

const consoleOut = document.querySelector("#ConsoleLog span")
const updateConsole = (text) => {
  // consoleOut.title = text
  consoleOut.innerHTML = text
}
// const fileDialogBtn = document.querySelector('#party')
// fileDialogBtn.addEventListener('click', () => {
//   mainProcess.selectDirectory()
// })

audioPlayer.onloadedmetadata = () => {
  audioPlayer.ontimeupdate = () => {
    const trackTime = document.querySelector('#TrackTime')
    const trackDuration = document.querySelector('#TrackDuration')

    let curmins = Math.floor(audioPlayer.currentTime / 60)
    let cursecs = Math.floor(audioPlayer.currentTime - curmins * 60)
    let durmins = Math.floor(audioPlayer.duration / 60)
    let dursecs = Math.floor(audioPlayer.duration - durmins * 60)

    if(cursecs < 10) { cursecs = '0' + cursecs; }
    if(dursecs < 10) { dursecs = '0' + dursecs; }
    if(curmins < 10) { curmins = '0' + curmins; }
    if(durmins < 10) { durmins = '0' + durmins; }

    trackTime.innerHTML = curmins + ':' + cursecs
    trackDuration.innerHTML = durmins + ':' + dursecs
  }
}
audioPlayer.onplay = () => {
  updateConsole('<i class="glyphicon glyphicon-play"></i> Playing')
}
audioPlayer.onpause = () => {
  updateConsole('<i class="glyphicon glyphicon-pause"></i> Paused')
}

const menu = new Menu()
menu.append(new MenuItem({ id: 1, label: 'Play', click() { console.log('clicked play') } }))
menu.append(new MenuItem({ id: 2, label: 'Edit', click() { console.log('clicked edit') } }))
menu.append(new MenuItem({ id: 3, type:  'separator' }))
menu.append(new MenuItem({ id: 4, label: 'Favorite', type: 'checkbox', checked: false }))

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  let tr = false;
  for(let i = 0; i < e.path.length; i++) {
    if (e.path[i].className == 'item') {
      tr = true;
      break;
    }
  }
  if (tr) {
    console.log(menu.getMenuItemById(1));
    menu.popup({ window: remote.getCurrentWindow() })
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

const sorterClicked = (sortType) => {
  switch(sortType) {
    case 'artists':
      Library.viewModel.libraryCoreData.sort(sort.sortArtists)
      break;
    case 'titles':
      Library.viewModel.libraryCoreData.sort(sort.sortTitles)
      break;
    case 'genres':
      Library.viewModel.libraryCoreData.sort(sort.sortGenres)
      break;
    case 'years':
      Library.viewModel.libraryCoreData.sort(sort.sortYears)
      break;
  }
  Library.viewModel.filteredLibrary(Library.viewModel.getFilteredLibrary());
}

const Library = new function() {
  const libCore = this;

  libCore.viewModel = null

  libCore.libraryViewModel = function() {
    const libVM = this

    libVM.libraryCoreData = []

    libVM.currentArtist = ko.observable()
    libVM.currentTitle = ko.observable()
    libVM.currentFile = ko.observable()

    libVM.filterGroups = {}
    libVM.filteredLibrary = ko.observableArray([])

    libVM.getFilterGroupAsList = () => {
      let filterGroupList = []

      for (let key in libCore.viewModel.filterGroups) {
        filterGroupList.push({
          name: key,
          filters: libCore.viewModel.filterGroups[key].all,
          selected: libCore.viewModel.filterGroups[key].selected
        });
      }

      return filterGroupList
    };

    libVM.filterClicked = (filter) => {
      //console.log(filter);
      libCore.toggleFilter(filter)
      libVM.setItemFlags()
      libVM.filteredLibrary(libVM.getFilteredLibrary())

      $(window).trigger('resize');
      console.log('filter');
    };

    libVM.setItemFlags = () => {
      libVM.libraryCoreData.forEach((item) => {
        item.active(false);
      });

      libVM.filteredLibrary().forEach((item) => {
        item.active(false);
      });
    };

    libVM.getFilteredLibrary = () => {
      let filteredLibrary = libVM.libraryCoreData;

      for (let key in libVM.filterGroups) {
        filteredLibrary = libCore.filterByGroup(key, filteredLibrary);
      }

      return filteredLibrary;
    };

    libVM.itemClick = (item) => {
      const promise = dataUrl.base64(item.filePath);
      promise.then((fileBuffer) => {
        // update audio player artist and song tile text display
        libVM.currentArtist(item.artist)
        libVM.currentTitle(item.title)
        // load base64 audio buffer and play it
        audioSource.src = fileBuffer
        audioPlayer.load()
        audioPlayer.play()
      })
    }

    libVM.pauseClicked = () => {
      audioPlayer.pause();
    }

    libVM.playClicked = () => {
      audioPlayer.play();
    }

    libVM.editClicked = (item) => {
      // console.log(item)
      $('#modal .modal-title').html('Edit Info')
      $('#modal .modal-body').html(id3.editorTemplate(item))
      $('#modal').modal('show')

      $(function () {
        $('[data-toggle="tooltip"]').tooltip()
      })

      const id3UForm = document.querySelector('#Id3EditorForm')
      const id3UpdateBtn = document.querySelector('#Id3UpdateBtn')

      id3UpdateBtn.addEventListener('click', () => {
        console.log('updating item')

        const storageData = storage.get('library')
        const storageUpdate = storageData.map((itemInStorage) => {
          if (JSON.stringify(itemInStorage) === JSON.stringify(item)) {
            itemInStorage.artist      = id3UForm.ArtistInput.value ? id3UForm.ArtistInput.value : 'Unknown'
            itemInStorage.title       = id3UForm.TitleInput.value ? id3UForm.TitleInput.value : 'Untitled'
            itemInStorage.album       = id3UForm.AlbumInput.value ? id3UForm.AlbumInput.value : ''
            itemInStorage.year        = id3UForm.YearInput.value ? id3UForm.YearInput.value : ''
            itemInStorage.copyright   = id3UForm.CopyrightInput.value ? id3UForm.CopyrightInput.value : ''
            itemInStorage.url         = id3UForm.UrlInput.value ? id3UForm.UrlInput.value : ''
            itemInStorage.description = id3UForm.DescInput.value ? id3UForm.DescInput.value : ''
            itemInStorage.genre       = id3UForm.GenreInput.value ? id3UForm.GenreInput.value : ''
            itemInStorage.bpm         = id3UForm.BpmInput.value ? id3UForm.BpmInput.value : ''
            itemInStorage.tags        = id3UForm.TagsInput.value ? [id3UForm.TagsInput.value] : []
          }
          return itemInStorage;
        })
        //  console.log(storageUpdate)

        storage.set('library', storageUpdate)
        libCore.updateCallback(storageUpdate)
        $('#modal').modal('hide')
      })
    }
  };

  libCore.toggleFilter = (filter) => {
    const filterLabel = filter.label;
    filter.active(!filter.active());
    libCore.updateFilterSelection(libCore.viewModel.filterGroups[filter.label].selected, filter);
    libCore.updateDisabledFlags();
  };

  libCore.enableFilter = (filter) => {
    filter.disabled(false);
  };

  libCore.disableFilter = (selectionArray, filter) => {
    filter.active(false);
    filter.disabled(true);
    libCore.updateFilterSelection(selectionArray, filter);
  };

  libCore.applyFilters = function(filters, items) {
    // pass if it passes any filter in filterGroup
    return items.filter((item) => {
      for (let i in filters) {
        const filterGroup = libCore.viewModel.filterGroups[filters[i].label];

        if (filterGroup.filterMethod(filters[i], item)) {
          return true;
        }
      }
      return false;
    });
  };

  libCore.filterByGroup = (filterGroup, items) => {
    const activeFilters = libCore.viewModel.filterGroups[filterGroup].selected();
    return activeFilters.length !== 0 ? libCore.applyFilters(activeFilters, items) : items;
  };

  libCore.updateFilterSelection = (selectionArray, item) => {
    if (item.active()) {
      selectionArray.push(item);
    }
    else {
      selectionArray.remove(item);
    }
  };

  libCore.updateDisabledFlagsInGroup = (filterGroupName) => {
    let filteredLibrary = libCore.viewModel.libraryCoreData;
    // apply all filters in other groups
    for (let key in libCore.viewModel.filterGroups) {
      if (key !== filterGroupName) {
        filteredLibrary = libCore.filterByGroup(key, filteredLibrary);
      }
    }

    const filterGroup = libCore.viewModel.filterGroups[filterGroupName];
    filterGroup.all.forEach((filter) => {
      // disable filter if applying it would result in an empty set
      const tempFilteredLibrary = libCore.applyFilters([filter], filteredLibrary);
      if (tempFilteredLibrary.length === 0) {
        libCore.disableFilter(filterGroup.selected, filter)
      } else {
        libCore.enableFilter(filter);
      }
    });
  };

  libCore.updateDisabledFlags = () => {
    for (let key in libCore.viewModel.filterGroups) {
      libCore.updateDisabledFlagsInGroup(key);
    }
  };

  libCore.addFilterGroup = (name, filters, filterMethod) => {
    libCore.viewModel.filterGroups[name] = {
      all: filters.map((filter) => {
        filter.label = name;
        filter.active = ko.observable(false);
        filter.disabled = ko.observable(false);
        return filter;
      }),
      selected: ko.observableArray([]),
      filterMethod: filterMethod
    };
  };

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
  };

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
  };

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
  };

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
  };

  libCore.filtersSetup = (libraryData) => {
    // setup filter groups

    const typeFilters = libCore.getTypeFilters(libraryData);
    libCore.addFilterGroup('Type', typeFilters, (filter, item) => {
      return item.type === filter.value;
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
      const promise = dataUrl.base64(libItem.filePath);

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
          console.log(finishedBuffers);
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
    libCore.librarySetup(libraryData)
    libCore.updateDisabledFlags()
    // console.log(storage.get('library'))
  }

  libCore.initCallback = (libraryData) => {
    libCore.filtersSetup(libraryData)
    libCore.librarySetup(libraryData)
    libCore.updateDisabledFlags()
    ko.applyBindings(libCore.viewModel, document.getElementById('musicLibrary'))
    // console.log(libCore.viewModel.filteredLibrary())

    // front load audio files
    libCore.storeBase64(libraryData) // TODO do more testing with storage, currently only for show...

    // sets up fixed position table header
    $(document).ready(function() {
      $('table').tableFixedHeader({
        scrollContainer: '.scroll-area'
      })
      $('table th a').on('click', (elm) => {
        sorterClicked(elm.currentTarget.dataset.sorter)
      })
    })
  };

  libCore.init = () => {
    $('#modal .modal-title').html('Please wait...')
    $('#modal .modal-body').html('<p>Reading: ' + libPath + '</p>' + progressBarHtml)
    $('#modal').modal('show')

    libCore.viewModel = new libCore.libraryViewModel()
    libCore.initCallback(storage.get('library'))
  };
};

storage.clear()

$('#modal .modal-title').html('Please wait...')
$('#modal .modal-body').html('<p>Preparing system...</p>')
$('#modal').modal('show')

window.setTimeout(() => {
  dir.walkParallel(libPath, (err, results) => {
    if (err)
      throw err;

    results.forEach((filePath, id) => {
      const fileName = filePath.substr(filePath.lastIndexOf('\/') + 1, filePath.length)

      if (fileName.split('.').pop() === 'mp3') {
        const info = id3.get(filePath)

        libraryTempData.push({
          catNum: '',
          compilationId: null,
          artist: info.artist ? info.artist : 'Unknown',
          title: info.title ? info.title : 'Untitled',
          description: info.comment ? info.comment.text : '',
          genre: info.genre ? info.genre : '',
          bpm: info.bpm ? info.bpm : '',
          type: 'single',
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

    libraryTempData.sort(sort.sortArtists)
    storage.set('library', libraryTempData)
    libraryTempData = []

    Library.init()
  })
}, 1000)
