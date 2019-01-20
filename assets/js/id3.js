// assets/js/id3.js

const id3 = require('node-id3')

exports.update = (tags, file, callbackFunc) => {
  return id3.update(tags, file, callbackFunc)
}

exports.get = (file) => {
  return id3.read(file)
}

exports.editorTemplate = (item) => {
  let htmlTemp = ''

  htmlTemp = '<form id="Id3EditorForm" class="form-horizontal">'

           + '<div class="form-group">'
             + '<label class="col-xs-3 control-label">Cover Image</label>'
             + '<div class="col-xs-9">'
               + '<img id="CoverImage" src="">'
               + '<div>'
                 + '<button id="FileBtn" class="btn btn-brand-primary btn-sm btn-rounded">Browse File</button>'
                 + '<input id="CoverInput" type="hidden" value="" />'
               + '</div>'
             + '</div>'
           + '</div>'

           + '<div class="form-group">'
             + '<label class="col-xs-3 control-label" for="FileNameDisabled">File Name</label>'
             + '<div class="col-xs-9">'
               + '<input type="text" class="form-control input-sm" id="FileNameDisabled" placeholder="Original file name" value="' + item.fileName + '" title="Can not edit file name here" disabled>'
             + '</div>'
           + '</div>'

           + '<div class="form-group">'
             + '<label class="col-xs-3 control-label" for="FileType">File Type</label>'
             + '<div class="col-xs-9">'
               + '<input type="text" class="form-control input-sm" id="FileType" placeholder="Single or Album" value="' + item.type + '">'
             + '</div>'
           + '</div>'

           + '<div class="form-group">'
             + '<label class="col-xs-3 control-label" for="ArtistInput">Artist</label>'
             + '<div class="col-xs-9">'
               + '<input type="text" class="form-control input-sm" id="ArtistInput" placeholder="Artist name" value="' + item.artist + '">'
             + '</div>'
           + '</div>'

           + '<div class="form-group">'
             + '<label class="col-xs-3 control-label" for="TitleInput">Title</label>'
             + '<div class="col-xs-9">'
               + '<input type="text" class="form-control input-sm" id="TitleInput" placeholder="Song title" value="' + item.title + '">'
             + '</div>'
           + '</div>'

           + '<div class="form-group">'
             + '<label class="col-xs-3 control-label" for="AlbumInput">Album</label>'
             + '<div class="col-xs-9">'
               + '<input type="text" class="form-control input-sm" id="AlbumInput" placeholder="Album title" value="' + item.album + '">'
             + '</div>'
           + '</div>'

           + '<div class="form-group">'
             + '<label class="col-xs-3 control-label" for="YearInput">Year</label>'
             + '<div class="col-xs-9">'
               + '<input type="text" class="form-control input-sm" id="YearInput" placeholder="Year" value="' + item.year + '">'
             + '</div>'
           + '</div>'

           + '<div class="form-group">'
             + '<label class="col-xs-3 control-label" for="CopyrightInput">Copyright</label>'
             + '<div class="col-xs-9">'
               + '<input type="text" class="form-control input-sm" id="CopyrightInput" placeholder="Copyright" value="' + item.copyright + '">'
             + '</div>'
           + '</div>'

           + '<div class="form-group">'
             + '<label class="col-xs-3 control-label" for="UrlInput">Url</label>'
             + '<div class="col-xs-9">'
               + '<input type="text" class="form-control input-sm" id="UrlInput" placeholder="URL" value="' + item.url + '">'
             + '</div>'
           + '</div>'

           + '<div class="form-group">'
             + '<label class="col-xs-3 control-label" for="DescInput">Description</label>'
             + '<div class="col-xs-9">'
               + '<input type="text" class="form-control input-sm" id="DescInput" placeholder="Description" value="' + item.description + '">'
             + '</div>'
           + '</div>'

           + '<div class="form-group">'
             + '<label class="col-xs-3 control-label" for="GenreInput">Genre</label>'
             + '<div class="col-xs-9">'
               + '<input type="text" class="form-control input-sm" id="GenreInput" placeholder="Genre" value="' + item.genre + '">'
             + '</div>'
           + '</div>'

           + '<div class="form-group">'
             + '<label class="col-xs-3 control-label" for="BpmInput">BPM</label>'
             + '<div class="col-xs-9">'
               + '<input type="text" class="form-control input-sm" id="BpmInput" placeholder="BPM" value="' + item.bpm + '">'
             + '</div>'
           + '</div>'

           + '<div class="form-group">'
             + '<label class="col-xs-3 control-label" for="TagsInput">Tags</label>'
             + '<div class="col-xs-9">'
               + '<textarea class="form-control input-sm" id="TagsInput" placeholder="Tags (seperate with commas)" data-toggle="tooltip" data-placement="bottom" data-trigger="hover" title="Seperate tags with commas">' + item.tags + '</textarea>'
             + '</div>'
           + '</div>'

           + '<div class="row">'
             + '<div class="col-xs-12 text-right">'
               + '<button id="Id3UpdateBtn" type="button" class="btn btn-brand-primary btn-small">Update</button>'
             + '</div>'
           + '</div>'
           + '</form>';

  return htmlTemp
}
