// assets/js/sort.js

exports.sortArtists = (a,b) => {
  if (a.artist < b.artist)
    return -1;
  if (a.artist > b.artist)
    return 1;
  return 0;
}

exports.sortTitles = (a,b) => {
  if (a.title < b.title)
    return -1;
  if (a.title > b.title)
    return 1;
  return 0;
}

exports.sortGenres = (a,b) => {
  if (a.genre < b.genre)
    return -1;
  if (a.genre > b.genre)
    return 1;
  return 0;
}

exports.sortYears = (a,b) => {
  if (a.year < b.year)
    return -1;
  if (a.year > b.genre)
    return 1;
  return 0;
}
