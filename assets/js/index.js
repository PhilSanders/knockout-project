// index.js

const BrowserWindow = require('electron').remote.BrowserWindow
const remote = require('electron').remote
const fs = remote.require('fs')
const id3 = require('node-id3')
const dataurl = require('dataurl')
const ko = require('knockout')
const mainProcess = remote.require('./main')
const dir = remote.require('./assets/js/dir')
const sort = remote.require('./assets/js/sort')
const store = require('electron-store')
const storage = new store()

let libPath = '/Users/philsanders/Desktop/PillFORM'

let audioPlayer = document.querySelector('#AudioPlayer')
let audioSource = document.querySelector('#AudioMp3')

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
};

const base64 = (filePath) => {
  const songPromise = new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) { reject(err); }
      resolve(dataurl.convert({ data, mimetype: 'audio/mp3' }));
    });
  });
  return songPromise;
};

const id3EditorTemplate = (item) => {
  let htmlTemp = ''

  htmlTemp = '<form class="form-horizontal">'
           + '<div class="form-group">'
             + '<div class="col-sm-3 text-right" for="ArtistInput"><strong>File Name</strong></div>'
             + '<div class="col-sm-9">'
               + item.fileName
             + '</div>'
           + '</div>'
           + '<div class="form-group">'
             + '<label class="col-sm-3 control-label" for="ArtistInput">Artist</label>'
             + '<div class="col-sm-9">'
               + '<input type="text" class="form-control" id="ArtistInput" placeholder="Artist name" value="' + item.artist + '">'
             + '</div>'
           + '</div>'
           + '<div class="form-group">'
             + '<label class="col-sm-3 control-label" for="TitleInput">Title</label>'
             + '<div class="col-sm-9">'
               + '<input type="text" class="form-control" id="TitleInput" placeholder="Song title" value="' + item.title + '">'
             + '</div>'
           + '</div>'
           + '<div class="form-group">'
             + '<label class="col-sm-3 control-label" for="AlbumInput">Album</label>'
             + '<div class="col-sm-9">'
               + '<input type="text" class="form-control" id="AlbumInput" placeholder="Album title" value="' + item.album + '">'
             + '</div>'
           + '</div>'
           + '<div class="form-group">'
             + '<label class="col-sm-3 control-label" for="YearInput">Year</label>'
             + '<div class="col-sm-9">'
               + '<input type="text" class="form-control" id="YearInput" placeholder="Year" value="' + item.year + '">'
             + '</div>'
           + '</div>'
           + '<div class="form-group">'
             + '<label class="col-sm-3 control-label" for="CopyrightInput">Copyright</label>'
             + '<div class="col-sm-9">'
               + '<input type="text" class="form-control" id="CopyrightInput" placeholder="Copyright" value="' + item.copyright + '">'
             + '</div>'
           + '</div>'
           + '<div class="form-group">'
             + '<label class="col-sm-3 control-label" for="UrlInput">Url</label>'
             + '<div class="col-sm-9">'
               + '<input type="text" class="form-control" id="UrlInput" placeholder="Url" value="' + item.url + '">'
             + '</div>'
           + '</div>'
           + '<div class="form-group">'
             + '<label class="col-sm-3 control-label" for="DescInput">Description</label>'
             + '<div class="col-sm-9">'
               + '<input type="text" class="form-control" id="DescInput" placeholder="Description" value="' + item.description + '">'
             + '</div>'
           + '</div>'
           + '<div class="form-group">'
             + '<label class="col-sm-3 control-label" for="GenreInput">Genre</label>'
             + '<div class="col-sm-9">'
               + '<input type="text" class="form-control" id="GenreInput" placeholder="Genre" value="' + item.genre + '">'
             + '</div>'
           + '</div>'
           + '<div class="form-group">'
             + '<label class="col-sm-3 control-label" for="TagsInput">Tags</label>'
             + '<div class="col-sm-9">'
               + '<textarea class="form-control" id="TagsInput" placeholder="Tags">' + item.tags + '</textarea>'
             + '</div>'
           + '</div>'
           + '</form>';

  return htmlTemp
}

const Library = new function() {
  const libCore = this;

  libCore.viewModel = null

  libCore.libraryViewModel = function() {
    const libVM = this

    libVM.libraryCoreData = []

    libVM.currentArtist = ko.observable('PillFORK')
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

    libVM.sortClicked = (sortType) => {
      switch(sortType) {
        case 'artists':
          libVM.libraryCoreData.sort(sort.sortArtists)
          break;
        case 'titles':
          libVM.libraryCoreData.sort(sort.sortTitles)
          break;
        case 'genres':
          libVM.libraryCoreData.sort(sort.sortGenres)
          break;
        case 'years':
          libVM.libraryCoreData.sort(sort.sortYears)
          break;
      }
      libVM.filteredLibrary(libVM.getFilteredLibrary());
    }

    libVM.itemClick = (item) => {
      const filePromise = base64(item.filePath);

      filePromise.then((fileData) => {
        // console.log(fileData);
        // display artist and song tile text
        libVM.currentArtist(item.artist)
        libVM.currentTitle(item.title)

        // load audio from disk and play it
        audioSource.src = fileData
        audioPlayer.load()
        audioPlayer.play()
        console.log('playing')
      });
    }

    libVM.pauseClicked = () => {
      audioPlayer.pause();
      console.log('paused')
    }

    libVM.playClicked = () => {
      audioPlayer.play();
      console.log('playing')
    }

    libVM.editClicked = (item) => {
      console.log(item)
      $('#modal .modal-title').html('Edit ID3 Tag')
      $('#modal .modal-body').html(id3EditorTemplate(item))
      $('#modal').modal('show')
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

  libCore.initCallback = (libraryArray) => {
    // setup catalog data
    libCore.viewModel.libraryCoreData = libraryArray.map((item) => {
      item.active = ko.observable(true);
      return item;
    });

    // setup filter groups
    const typeFilters = libCore.getTypeFilters(libraryArray);
    libCore.addFilterGroup('Type', typeFilters, (filter, item) => {
      return item.type === filter.value;
    });

    const yearFilters = libCore.getYearFilters(libraryArray);
    libCore.addFilterGroup('Year', yearFilters, (filter, item) => {
      return item.year === filter.value;
    });

    const genreFilters = libCore.getGenreFilters(libraryArray);
    libCore.addFilterGroup('Genre', genreFilters, (filter, item) => {
      return item.genre === filter.value;
    });

    const tagFilters = libCore.getTagFilters(libraryArray);
    libCore.addFilterGroup('Tags', tagFilters, (filter, item) => {
      return item.tags.indexOf(filter.value) !== -1;
    });

    libCore.viewModel.filteredLibrary(libCore.viewModel.getFilteredLibrary());

    libCore.updateDisabledFlags();

    ko.applyBindings(libCore.viewModel, document.getElementById('musicLibrary'));
  };

  libCore.init = () => {
    libCore.viewModel = new libCore.libraryViewModel();
    libCore.initCallback(storage.get('library'));
  };
};

dir.walkParallel(libPath, (err, results) => {
  if (err)
    throw err;

  let libraryData = []

  results.forEach((file, n) => {
    let info = id3.read(file),
        fileTrimmed = file.substring(1, file.length);

    libraryData.push({
      catNum: '',
      compilationId: null,
      artist: info.artist ? info.artist : 'Unknown',
      title: info.title ? info.title : 'Untitled',
      description: info.comment ? info.comment.text : '',
      genre: info.genre ? info.genre : '',
      type: 'single',
      album: info.album ? info.album : 'Unreleased',
      cover: '',
      year: info.year ? info.year : '',
      copyright: info.copyright ? info.copyright : '',
      url: '',
      tags: [],
      filePath: file,
      fileName: file.substr(file.lastIndexOf('\/') + 1, file.length)
    })
  })

  libraryData.sort(sort.sortArtists);
  storage.set('library', libraryData)

  Library.init()
})
