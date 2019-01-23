// index.js
window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

const BrowserWindow = require('electron').remote.BrowserWindow
const remote = require('electron').remote
const { Menu, MenuItem } = remote
const ko = require('knockout')
const mainProcess = remote.require('./main')
const dir = remote.require('./assets/js/dir')
const fastSort = require('fast-sort')
const dataUrl = remote.require('./assets/js/base64')
const id3 = remote.require('./assets/js/id3')
const store = require('electron-store')
const storage = new store()

const defaultLibPath = './mp3'

let libPath
let libraryTempData = []
let libPathInput

const getComputedStyle = (selectorProp, styleProp) => {
  let para = document.querySelector(selectorProp);
  let compStyles = window.getComputedStyle(para);
  return compStyles.getPropertyValue(styleProp);
}

let themePallete = {
  'primary': getComputedStyle('.theme-pallete .primary', 'background-color'),
  'light': getComputedStyle('.theme-pallete .primary-light', 'background-color'),
  'dark': getComputedStyle('.theme-pallete .primary-dark', 'background-color'),
  'highlight': getComputedStyle('.theme-pallete .primary-highlight', 'background-color')
}

const consoleOut = document.querySelector("#ConsoleLog span")
const updateConsole = (text) => {
  // consoleOut.title = text
  consoleOut.innerHTML = text
}

const dirDialogBtn = document.querySelector('#DirInput')
dirDialogBtn.addEventListener('click', () => {
  mainProcess.selectDirectory((path) => {
    if (path) {
      storage.set('preferences.libraryPath', path[0])
      updateLibPath()
    }
  })
})

let audioPlayer = document.querySelector('#AudioPlayer')
let audioSource = document.querySelector('#AudioMp3')
let audioVolInput = document.querySelector('#VolumeSlider')

audioVolInput.value = audioPlayer.volume;

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

    $('#seekbar').attr('value', audioPlayer.currentTime / audioPlayer.duration);
  }
}

audioPlayer.onplay = () => {
  updateConsole('<i class="glyphicon glyphicon-play"></i> Playing')
}
audioPlayer.onpause = () => {
  updateConsole('<i class="glyphicon glyphicon-pause"></i> Paused')
}

audioVolInput.addEventListener('input', (e) => {
  audioPlayer.volume = audioVolInput.value;
})

let ctx = new AudioContext();
const analyser = ctx.createAnalyser();
const audioSrc = ctx.createMediaElementSource(audioPlayer);

audioSrc.connect(analyser);
analyser.connect(ctx.destination);
// analyser.fftSize = 64;
// frequencyBinCount tells you how many values you'll receive from the analyser
const frequencyData = new Uint8Array(analyser.frequencyBinCount);

const canvas = document.getElementById('canvas'),
    cwidth = canvas.width,
    cheight = canvas.height - 2,
    meterWidth = 11, //width of the meters in the spectrum
    gap = 1, //gap between meters
    capHeight = 1,
    capStyle = themePallete.highlight,
    meterNum = 800 / (6 + 2), //count of the meters
    capYPositionArray = []; ////store the vertical position of hte caps for the preivous frame

ctx = canvas.getContext('2d'),
gradient = ctx.createLinearGradient(0, 0, 0, 300);
gradient.addColorStop(1, themePallete.primary);
gradient.addColorStop(0.5, themePallete.primary);
gradient.addColorStop(0, themePallete.light);

const renderFrame = () => {
    const array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    const step = Math.round(array.length / meterNum); //sample limited data from the total array
    ctx.clearRect(0, 0, cwidth, cheight);
    for (let i = 0; i < meterNum; i++) {
        const value = array[i * step];
        if (capYPositionArray.length < Math.round(meterNum)) {
            capYPositionArray.push(value);
        };
        ctx.fillStyle = capStyle;
        //draw the cap, with transition effect
        if (value < capYPositionArray[i]) {
            ctx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight);
        } else {
            ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight);
            capYPositionArray[i] = value;
        };
        ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
        ctx.fillRect(i * 12 /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight); //the meter
    }
    requestAnimationFrame(renderFrame);
}

let contextMenuRef; // this should always be an html element (tr)

const menu = new Menu()
menu.append(new MenuItem({ id: 1, label: 'Play', click() { menuPlayClicked() } }))
menu.append(new MenuItem({ id: 2, label: 'Edit', click() { menuEditClicked() } }))
menu.append(new MenuItem({ id: 3, type:  'separator' }))
menu.append(new MenuItem({ id: 4, label: 'Favorite', type: 'checkbox', checked: false }))

menu.on('menu-will-close', () => {
  console.log('content mneu closed');
  contentMenuRef = null;
})

const menuPlayClicked = () => {
  contextMenuRef.children[0].children[0].click();
}

const menuEditClicked = () => {
  contextMenuRef.children[contextMenuRef.cells.length - 1].children[0].click();
}

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  let tr;
  for(let i = 0; i < e.path.length; i++) {
    if (e.path[i].className === 'item') {
      tr = e.path[i];
      break;
    }
  }
  if (tr) {
    contextMenuRef = tr;
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

  // console.log(tags)

  //  Create a ID3-Frame buffer from passed tags
  //  Synchronous
  // let ID3FrameBuffer = NodeID3.create(tags)   //  Returns ID3-Frame buffer
  //  Asynchronous
  // NodeID3.create(tags, function(frame) {  })

  //  Write ID3-Frame into (.mp3) file
  // let success = NodeID3.write(tags, file) //  Returns true/false or, if buffer passed as file, the tagged buffer
  // NodeID3.write(tags, file, function(err, buffer) {  }) //  Buffer is only returned if a buffer was passed as file

  //  Update existing ID3-Frame with new/edited tags
  let success = id3.update(tags, item.filePath) //  Returns true/false or, if buffer passed as file, the tagged buffer
  // success.then((data) => { console.log(data) })
  // NodeID3.update(tags, file, function(err, buffer) {  })  //  Buffer is only returned if a buffer was passed as file
}

const encode = (input) => {
    const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output = "";
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    let i = 0;

    while (i < input.length) {
        chr1 = input[i++];
        chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index
        chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                  keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }
    return output;
}

const updateLibPath = () => {
  console.log('update preferences')
  // const libraryData = storage.get('library')

  audioPlayer.pause()

  $('#modal .modal-title').html('Please wait...')
  $('#modal .modal-body').html('<p>Preparing system...</p>')
  $('#modal').modal('show')

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
            artist: info.artist ? info.artist : 'Unknown',
            title: info.title ? info.title : 'Untitled',
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

const Library = new function() {
  const libCore = this;

  libCore.viewModel = null

  libCore.libraryViewModel = function() {
    const libVM = this

    libVM.libraryCoreData = []

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
    };

    libVM.filterClicked = (filter) => {
      //console.log(filter);
      libCore.toggleFilter(filter)
      libVM.setItemFlags()
      libVM.filteredLibrary(libVM.getFilteredLibrary())

      $(window).trigger('resize');
      // console.log('filter');
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

      for (let key in libVM.filterGroups()) {
        filteredLibrary = libCore.filterByGroup(key, filteredLibrary);
      }

      return filteredLibrary;
    };

    libVM.itemClick = (item) => {
      const promise = dataUrl.base64(item.filePath, 'audio/mp3');
      promise.then((fileBuffer) => {
        // update audio player artist and song tile text display
        libVM.currentArtist(item.artist)
        libVM.currentTitle(item.title)
        // load base64 audio buffer and play it
        audioSource.src = fileBuffer
        audioPlayer.load()
        audioPlayer.play()

        renderFrame();
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

      const fileDialogBtn = document.querySelector('#FileBtn')
      const coverInput = document.querySelector('#CoverInput')
      const coverImg = document.querySelector('#CoverImage')

      if (item.cover) {
        console.log(item.cover);
        const arrayBuffer = id3.get(item.filePath).image.imageBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        coverImg.src = 'data:image/png;base64,' + encode(bytes)
      }

      fileDialogBtn.addEventListener('click', (e) => {
        e.preventDefault()
        mainProcess.selectImage((filePaths) => {
          coverInput.value = filePaths ? filePaths[0] : ''
        })
      })

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
  };

  libCore.toggleFilter = (filter) => {
    const filterLabel = filter.label;
    filter.active(!filter.active());
    libCore.updateFilterSelection(libCore.viewModel.filterGroups()[filter.label].selected, filter);
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
        const filterGroup = libCore.viewModel.filterGroups()[filters[i].label];

        if (filterGroup.filterMethod(filters[i], item)) {
          return true;
        }
      }
      return false;
    });
  };

  libCore.filterByGroup = (filterGroup, items) => {
    const activeFilters = libCore.viewModel.filterGroups()[filterGroup].selected();
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
  };

  libCore.updateDisabledFlags = () => {
    for (let key in libCore.viewModel.filterGroups()) {
      libCore.updateDisabledFlagsInGroup(key);
    }
  };

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
    libCore.refreshTagFilters(libraryData)
    libCore.librarySetup(libraryData)
    libCore.updateDisabledFlags()
    $(window).trigger('resize');
    // console.log(storage.get('library'))
  }

  libCore.initCallback = (libraryData) => {
    libCore.filtersSetup(libraryData)
    libCore.librarySetup(libraryData)
    libCore.updateDisabledFlags()
    ko.applyBindings(libCore.viewModel, document.getElementById('MusicLibrary'))
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
    $(document).ready(function() {
      $('table').tableFixedHeader({
        scrollContainer: '.scroll-area'
      })
      $('table th a').on('click', (elm) => {
        sorterClicked(elm.currentTarget.dataset.sorter)
      })
    })

    updateConsole('<i class="glyphicon glyphicon-stop"></i> Ready');
    $('#modal').modal('hide')
  };

  libCore.init = () => {
    libCore.viewModel = new libCore.libraryViewModel()
    libCore.initCallback(storage.get('library'))
  };
};

if (!storage.get('library'))
  storage.set('library', '')

if (!storage.get('preferences.libraryPath'))
  storage.set('preferences', { 'libraryPath': defaultLibPath })

$('#modal .modal-title').html('Please wait...')
$('#modal .modal-body').html('<p>Preparing system...</p>')
$('#modal').modal('show')

window.setTimeout(() => {
  if (!storage.get('library')) {
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
            artist: info.artist ? info.artist : 'Unknown',
            title: info.title ? info.title : 'Untitled',
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

      Library.init()
    })
  }
  else {
    Library.init()
  }
}, 1000)
