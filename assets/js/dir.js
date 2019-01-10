// assets/js/dir.js

const remote = require('electron').remote
const fs = remote.require('fs')
const path = remote.require('path')

exports.walkParallel = function(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err)
      return done(err);

    let pending = list.length;

    if (!pending)
      return done(null, results);

    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending)
              done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending)
            done(null, results);
        }
      });
    });
  });
}

exports.walkSerial = function(dir, done) {
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
