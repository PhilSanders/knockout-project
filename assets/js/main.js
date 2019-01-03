
const CatalogListCore = new function() {
  const core = this;

  core.viewModel = null;

  core.catalogViewModel = function() {
    const coreVM = this;

    coreVM.releasesData = [];

    coreVM.filterGroups = {};

    coreVM.filteredReleases = ko.observableArray([]);

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
      coreVM.filteredReleases(coreVM.getFilteredReleases());
    };

    coreVM.setItemFlags = function() {
      coreVM.releasesData.forEach(function(item) {
        item.active(false);
      });

      coreVM.filteredReleases().forEach(function(item) {
        item.active(false);
      });
    };

    coreVM.getFilteredReleases = function() {
      let filteredReleases = coreVM.releasesData;

      for (let key in coreVM.filterGroups) {
        filteredReleases = core.filterByGroup(key, filteredReleases);
      }

      return filteredReleases;
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
    let filteredReleases = core.viewModel.releasesData;
    // apply all filters in other groups
    for (let key in core.viewModel.filterGroups) {
      if (key !== filterGroupName) {
        filteredReleases = core.filterByGroup(key, filteredReleases);
      }
    }

    const filterGroup = core.viewModel.filterGroups[filterGroupName];
    filterGroup.all.forEach(function(filter) {
      // disable filter if applying it would result in an empty set
      const tempFilteredReleases = core.applyFilters([filter], filteredReleases);
      if (tempFilteredReleases.length === 0) {
        core.disableFilter(filterGroup.selected, filter)
      } else {
        core.enableFilter(filter);
      }
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

  core.getTypeFilters = function(data) {
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
    core.viewModel.releasesData = catalogData.releases.map(function(item) {
      item.active = ko.observable(true);
      return item;
    });

    // setup filter groups
    const typeFilters = core.getTypeFilters(catalogData.releases);
    core.addFilterGroup('Type', typeFilters, function(filter, item) {
      return item.type === filter.value;
    });

    const yearFilters = core.getYearFilters(catalogData.releases);
    core.addFilterGroup('Year', yearFilters, function(filter, item) {
      return item.year === filter.value;
    });

    const genreFilters = core.getGenreFilters(catalogData.releases);
    core.addFilterGroup('Genre', genreFilters, function(filter, item) {
      return item.genre === filter.value;
    });

    const tagFilters = core.getTagFilters(catalogData.releases);
    core.addFilterGroup('Tags', tagFilters, function(filter, item) {
      return item.tags.indexOf(filter.value) !== -1;
    });

    core.viewModel.filteredReleases(core.viewModel.getFilteredReleases());

    core.updateDisabledFlags();

    ko.applyBindings(core.viewModel, document.getElementById('catalogList'));
  };

  core.init = function() {
    core.viewModel = new core.catalogViewModel();
    CatalogData.getCatalogData(core.initCallback);
  };
};
