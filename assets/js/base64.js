// assets/js/base64.js

const fs = require('fs')
const dataurl = require('dataurl')

exports.base64 = (filePath) => {
  const promise = new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) { reject(err); }
      resolve(dataurl.convert({ data, mimetype: 'audio/mp3' }));
    });
  });
  return promise;
}
