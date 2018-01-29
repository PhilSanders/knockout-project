
const CatalogListCore = new function() {
  const core = this;

  core.viewModel = null;

  core.catalogViewModel = function() {
    const coreVM = this;

    coreVM.compilationData = [];

    coreVM.trackData = [];

    coreVM.filterGroups = {};

    coreVM.filterdCompilations = ko.observableArray([]);

    coreVM.filteredTracks = ko.observableArray([]);

    coreVM.getFilterGroupAsList = function() {
      let filterGroupList = [];

      for (let key in core.viewModel.filterGroups) {
        filterGroupList.push({
          name: key,
          filters: core.viewModel.filterGroups[key].all,
          selected: core.viewModel.filterGroups[key].selected
        });
      }

      return filterGroupList;
    };

    coreVM.filterClicked = function(filter) {
      //console.log(filter);
      core.toggleFilter(filter);
      coreVM.setItemFlags();
      coreVM.filteredTracks(coreVM.getFilteredTracks());
      coreVM.filterdCompilations(coreVM.getFilteredCompilations());
    };

    coreVM.setItemFlags = function() {
      // set flag for single tracks
      coreVM.trackData.forEach(function(item) {
        item.active(false);
      });

      coreVM.filteredTracks().forEach(function(item) {
        item.active(false);
      });

      // set flags for compilations
      coreVM.compilationData.forEach(function(item) {
        item.active(false);
      });

      coreVM.filterdCompilations().forEach(function(item) {
        item.active(false);
      });
    };

    coreVM.getFilteredTracks = function() {
      let filteredTracks = coreVM.trackData;

      for (let key in coreVM.filterGroups) {
        filteredTracks = core.filterByGroup(key, filteredTracks);
      }

      return filteredTracks;
    };

    coreVM.getFilteredCompilations = function() {
      let filterdCompilations = coreVM.compilationData;

      for (let key in coreVM.filterGroups) {
        filterdCompilations = core.filterByGroup(key, filterdCompilations);
      }

      return filterdCompilations;
    };
  };

  core.toggleFilter = function(filter) {
    const filterLabel = filter.label;
    filter.active(!filter.active());
    core.updateFilterSelection(core.viewModel.filterGroups[filter.label].selected, filter);
    core.updateDisabledFlags();
  };

  core.enableFilter = function(filter) {
    filter.disabled(false);
  };

  core.disableFilter = function(selectionArray, filter) {
    filter.active(false);
    filter.disabled(true);
    core.updateFilterSelection(selectionArray, filter);
  };

  core.applyFilters = function(filters, items) {
    // pass if it passes any filter in filterGroup
    return items.filter(function(item) {
      for (let i in filters) {
        const filterGroup = core.viewModel.filterGroups[filters[i].label];

        if (filterGroup.filterMethod(filters[i], item)) {
          return true;
        }
      }
      return false;
    });
  };

  core.filterByGroup = function(filterGroup, items) {
    const activeFilters = core.viewModel.filterGroups[filterGroup].selected();
    console.log(activeFilters);
    return activeFilters.length !== 0 ? core.applyFilters(activeFilters, items) : items;
  };

  core.updateFilterSelection = function(selectionArray, item) {
    if (item.active()) {
      selectionArray.push(item);
    }
    else {
      selectionArray.remove(item);
    }
  };

  core.updateDisabledFlagsInGroup = function(filterGroupName) {
    let filteredTracks = core.viewModel.trackData;
    // apply all filters in other groups
    for (let key in core.viewModel.filterGroups) {
      if (key !== filterGroupName) {
        filteredTracks = core.filterByGroup(key, filteredTracks);
      }
    }

//    let filteredCompilations = core.viewModel.compilationData;
//    // apply all filters in other groups
//    for (let key in core.viewModel.filterGroups) {
//      if (key !== filterGroupName) {
//        filteredCompilations = core.filterByGroup(key, filteredCompilations);
//      }
//    }

    const filterGroup = core.viewModel.filterGroups[filterGroupName];
    filterGroup.all.forEach(function(filter) {
      // disable filter if applying it would result in an empty set
      const tempFilteredTracks = core.applyFilters([filter], filteredTracks);
      if (tempFilteredTracks.length === 0) {
        core.disableFilter(filterGroup.selected, filter)
      } else {
        core.enableFilter(filter);
      }

//      const tempFilteredComps = core.applyFilters([filter], filteredCompilations);
//      if (tempFilteredComps.length === 0) {
//        core.disableFilter(filterGroup.selected, filter)
//      } else {
//        core.enableFilter(filter);
//      }
    });
  };

  core.updateDisabledFlags = function() {
    for (let key in core.viewModel.filterGroups) {
      core.updateDisabledFlagsInGroup(key);
    }
  };

  core.addFilterGroup = function(name, filters, filterMethod) {
    core.viewModel.filterGroups[name] = {
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

  core.getYearFilters = function(data) {
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

  core.getGenreFilters = function(data) {
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

  core.getCompilationFilters = function(data) {
    let compFiltersArray = [];

    data.forEach(function(item) {
      const filter = {
        value: item.title,
      };
      if (filter.value && compFiltersArray.map(function(f){ return f.value }).indexOf(filter.value) === -1) {
        compFiltersArray.push(filter);
      }
    });

    return compFiltersArray;
  };

  core.getTagFilters = function(data) {
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

  core.initCallback = function(catalogData) {
    // setup catalog data
    core.viewModel.compilationData = catalogData.compilations.map(function(item) {
      item.active = ko.observable(true);
      return item;
    });

    core.viewModel.trackData = catalogData.tracks.map(function(item) {
      item.active = ko.observable(true);
      return item;
    });

    // setup filter groups
    const yearFilters = core.getYearFilters(catalogData.tracks);
    core.addFilterGroup('Year', yearFilters, function(filter, item) {
      return item.year === filter.value;
    });

    const compFilters = core.getCompilationFilters(catalogData.compilations);
    core.addFilterGroup('Compilation', compFilters, function(filter, item) {
      return item.title === filter.value;
    });

    const genreFilters = core.getGenreFilters(catalogData.tracks);
    core.addFilterGroup('Genre', genreFilters, function(filter, item) {
      return item.genre === filter.value;
    });

    const tagFilters = core.getTagFilters(catalogData.tracks);
    core.addFilterGroup('Tags', tagFilters, function(filter, item) {
      return item.tags.indexOf(filter.value) !== -1;
    });

    core.viewModel.filteredTracks(core.viewModel.getFilteredTracks());

    core.viewModel.filterdCompilations(core.viewModel.getFilteredCompilations());

    core.updateDisabledFlags();

    // debug
//    console.log('comps',core.viewModel.compilationData);
//    console.log('tracks',core.viewModel.filteredTracks());
//    console.log('filters',core.viewModel.filterGroups);

    ko.applyBindings(core.viewModel, document.getElementById('catalogList'));
  };

  core.init = function() {
    core.viewModel = new core.catalogViewModel();
    CatalogData.getCatalogData(core.initCallback);
  };
};
