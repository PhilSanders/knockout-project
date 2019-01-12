// assets/js/dir.js

const fs = require('fs')
const path = require('path')

exports.walkParallel = function(dir, callbackFunc) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err)
      return callbackFunc(err);

    let pending = list.length;

    if (!pending)
      return callbackFunc(null, results);

    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          exports.walkParallel(file, function(err, res) {
            results = results.concat(res);
            if (!--pending)
              callbackFunc(null, results);
          });
        } else {
          results.push(file);
          if (!--pending)
            callbackFunc(null, results);
        }
      });
    });
  });
}

exports.walkSerial = function(dir, callbackFunc) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err)
      return callbackFunc(err);

    let i = 0;

    (function next() {
      let file = list[i++];
      if (!file)
        return callbackFunc(null, results);

      file = dir + '/' + file;

      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          exports.walkSerial(file, function(err, res) {
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
