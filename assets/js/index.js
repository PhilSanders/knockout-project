// index.js
console.log('index.js')

const BrowserWindow = require('electron').remote.BrowserWindow
const remote = require('electron').remote
const fs = remote.require('fs')
const id3 = require('node-id3')
const ko = require('knockout')
const mainProcess = remote.require('./main')
const sort = remote.require('./assets/js/sort')

let libraryData = []
let libPath = '/Users/philsanders/Desktop/PillFORM'

const fileDialogBtn = document.getElementById('party')
fileDialogBtn.addEventListener('click', function() {
  mainProcess.selectDirectory()
})

const walk = function(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err)
      return done(err);

    let i = 0;

    (function next() {
      let file = list[i++];

      if (!file)
        return done(null, results);

      file = dir + '/' + file;

      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
}

const LibraryFilter = new function() {
  const libCore = this;

  libCore.viewModel = null;

  libCore.libraryViewModel = function() {
    const libVM = this;

    libVM.libraryCoreData = [];

    libVM.filterGroups = {};

    libVM.filteredLibrary = ko.observableArray([]);

    libVM.getFilterGroupAsList = function() {
      let filterGroupList = [];

      for (let key in libCore.viewModel.filterGroups) {
        filterGroupList.push({
          name: key,
          filters: libCore.viewModel.filterGroups[key].all,
          selected: libCore.viewModel.filterGroups[key].selected
        });
      }

      return filterGroupList;
    };

    libVM.filterClicked = function(filter) {
      //console.log(filter);
      libCore.toggleFilter(filter);
      libVM.setItemFlags();
      libVM.filteredLibrary(libVM.getFilteredLibrary());
    };

    libVM.setItemFlags = function() {
      libVM.libraryCoreData.forEach(function(item) {
        item.active(false);
      });

      libVM.filteredLibrary().forEach(function(item) {
        item.active(false);
      });
    };

    libVM.getFilteredLibrary = function() {
      let filteredLibrary = libVM.libraryCoreData;

      for (let key in libVM.filterGroups) {
        filteredLibrary = libCore.filterByGroup(key, filteredLibrary);
      }

      return filteredLibrary;
    };

    libVM.sortClicked = function(sortType) {
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
  };

  libCore.toggleFilter = function(filter) {
    const filterLabel = filter.label;
    filter.active(!filter.active());
    libCore.updateFilterSelection(libCore.viewModel.filterGroups[filter.label].selected, filter);
    libCore.updateDisabledFlags();
  };

  libCore.enableFilter = function(filter) {
    filter.disabled(false);
  };

  libCore.disableFilter = function(selectionArray, filter) {
    filter.active(false);
    filter.disabled(true);
    libCore.updateFilterSelection(selectionArray, filter);
  };

  libCore.applyFilters = function(filters, items) {
    // pass if it passes any filter in filterGroup
    return items.filter(function(item) {
      for (let i in filters) {
        const filterGroup = libCore.viewModel.filterGroups[filters[i].label];

        if (filterGroup.filterMethod(filters[i], item)) {
          return true;
        }
      }
      return false;
    });
  };

  libCore.filterByGroup = function(filterGroup, items) {
    const activeFilters = libCore.viewModel.filterGroups[filterGroup].selected();
    return activeFilters.length !== 0 ? libCore.applyFilters(activeFilters, items) : items;
  };

  libCore.updateFilterSelection = function(selectionArray, item) {
    if (item.active()) {
      selectionArray.push(item);
    }
    else {
      selectionArray.remove(item);
    }
  };

  libCore.updateDisabledFlagsInGroup = function(filterGroupName) {
    let filteredLibrary = libCore.viewModel.libraryCoreData;
    // apply all filters in other groups
    for (let key in libCore.viewModel.filterGroups) {
      if (key !== filterGroupName) {
        filteredLibrary = libCore.filterByGroup(key, filteredLibrary);
      }
    }

    const filterGroup = libCore.viewModel.filterGroups[filterGroupName];
    filterGroup.all.forEach(function(filter) {
      // disable filter if applying it would result in an empty set
      const tempFilteredLibrary = libCore.applyFilters([filter], filteredLibrary);
      if (tempFilteredLibrary.length === 0) {
        libCore.disableFilter(filterGroup.selected, filter)
      } else {
        libCore.enableFilter(filter);
      }
    });
  };

  libCore.updateDisabledFlags = function() {
    for (let key in libCore.viewModel.filterGroups) {
      libCore.updateDisabledFlagsInGroup(key);
    }
  };

  libCore.addFilterGroup = function(name, filters, filterMethod) {
    libCore.viewModel.filterGroups[name] = {
      all: filters.map(function(filter) {
        filter.label = name;
        filter.active = ko.observable(false);
        filter.disabled = ko.observable(false);
        return filter;
      }),
      selected: ko.observableArray([]),
      filterMethod: filterMethod
    };
  };

  libCore.getTypeFilters = function(data) {
    let typeFiltersArray = [];

    data.forEach(function(item) {
      const filter = {
        value: item.type,
      };

      if (filter.value && typeFiltersArray.map(function(f){ return f.value }).indexOf(filter.value) === -1) {
        typeFiltersArray.push(filter);
      }
    });

    return typeFiltersArray;
  };

  libCore.getYearFilters = function(data) {
    let yearFiltersArray = [];

    data.forEach(function(item) {
      const filter = {
        value: item.year,
      };

      if (filter.value && yearFiltersArray.map(function(f){ return f.value }).indexOf(filter.value) === -1) {
        yearFiltersArray.push(filter);
      }
    });

    return yearFiltersArray;
  };

  libCore.getGenreFilters = function(data) {
    let genreFiltersArray = [];

    data.forEach(function(item) {
      const filter = {
        value: item.genre,
      };

      if (filter.value && genreFiltersArray.map(function(f){ return f.value }).indexOf(filter.value) === -1) {
        genreFiltersArray.push(filter);
      }
    });

    return genreFiltersArray;
  };

  libCore.getTagFilters = function(data) {
    let tagFiltersArray = [];

    data.forEach(function(item) {
      item.tags.forEach(function(tag) {
        const filter = {
          value: tag,
        };

        if (tag && tagFiltersArray.map(function(f){ return f.value }).indexOf(filter.value) === -1) {
          tagFiltersArray.push(filter);
        }
      });
    });

    return tagFiltersArray;
  };

  libCore.initCallback = function(libraryArray) {
    // setup catalog data
    libCore.viewModel.libraryCoreData = libraryArray.map(function(item) {
      item.active = ko.observable(true);
      return item;
    });

    // setup filter groups
    const typeFilters = libCore.getTypeFilters(libraryArray);
    libCore.addFilterGroup('Type', typeFilters, function(filter, item) {
      return item.type === filter.value;
    });

    const yearFilters = libCore.getYearFilters(libraryArray);
    libCore.addFilterGroup('Year', yearFilters, function(filter, item) {
      return item.year === filter.value;
    });

    const genreFilters = libCore.getGenreFilters(libraryArray);
    libCore.addFilterGroup('Genre', genreFilters, function(filter, item) {
      return item.genre === filter.value;
    });

    const tagFilters = libCore.getTagFilters(libraryArray);
    libCore.addFilterGroup('Tags', tagFilters, function(filter, item) {
      return item.tags.indexOf(filter.value) !== -1;
    });

    libCore.viewModel.filteredLibrary(libCore.viewModel.getFilteredLibrary());

    libCore.updateDisabledFlags();

    ko.applyBindings(libCore.viewModel, document.getElementById('musicLibrary'));
  };

  libCore.init = function() {
    libCore.viewModel = new libCore.libraryViewModel();
    libCore.initCallback(libraryData);
  };
};

walk(libPath, function(err, results) {
  if (err)
    throw err;

  results.forEach(function(file, n) {
    let info = id3.read(file)

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
      year: info.year,
      copyright: info.copyright,
      url: '',
      tags: []
    })
  })

  libraryData.sort(sort.sortArtists);

  LibraryFilter.init()
})
