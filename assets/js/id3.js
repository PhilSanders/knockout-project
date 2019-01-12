// assets/js/id3.js

const id3 = require('node-id3')

exports.get = (file) => {
  return id3.read(file)
}

exports.editorTemplate = (item) => {
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
