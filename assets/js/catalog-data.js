const CatalogData = new function() {
  const self = this;

  self.getCatalogData = function(callbackFunc) {
    const catalogData = {
      'compilations': [
        {
          'catNum': 'FFC001',
          'artist': 'PilFORM',
          'title': 'Refried 99\'',
          'description': 'The electro bass collection that started it all',
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['dark','experimental','robotic'],
          'year': 1999,
          'url': 'http://www.funkinfamily.com'
        },
        {
          'catNum': 'FFC002',
          'artist': 'PilFORM',
          'title': 'Revive',
          'description': 'Rivived tracks from the early days from 1999-2001 and released',
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['dark','modplug','robotic'],
          'year': 2003,
          'url': 'http://www.funkinfamily.com'
        }
      ],
      'tracks': [
        {
          'catNum': 'FF0001',
          'artist': 'PilFORM',
          'title': 'Conscious',
          'description': 'None',
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['dark','experimental','robotic'],
          'year': 1999,
          'compilationId': 'FFC001',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'catNum': 'FF0002',
          'artist': 'PilFORM',
          'title': 'Reverb Says',
          'description': null,
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['dark','experimental','robotic'],
          'year': 1999,
          'compilationId': 'FFC001',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'catNum': 'FF0003',
          'artist': 'PilFORM',
          'title': 'Domination 42',
          'description': null,
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['dark','experimental','robotic'],
          'year': 1999,
          'compilationId': 'FFC001',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'catNum': 'FF0004',
          'artist': 'PilFORM',
          'title': 'Testing',
          'description': null,
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['dark','experimental','robotic'],
          'year': 1999,
          'compilationId': 'FFC001',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'catNum': 'FF0005',
          'artist': 'PilFORM',
          'title': 'Sync Electro',
          'description': null,
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['dark','experimental','robotic'],
          'year': 1999,
          'compilationId': 'FFC001',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'catNum': 'FF0006',
          'artist': 'PilFORM',
          'title': 'Turn Up The Bass',
          'description': null,
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['modpug','robotic'],
          'year': 1999,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'catNum': 'FF0007',
          'artist': 'PilFORM',
          'title': 'Inner Robot',
          'description': null,
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['dark','modpug','robotic'],
          'year': 1999,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'catNum': 'FF0008',
          'artist': 'PilFORM',
          'title': 'Mod-Rhythm',
          'description': null,
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['dark','modpug','robotic'],
          'year': 1999,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'catNum': 'FF0009',
          'artist': 'PilFORM',
          'title': 'Techno Bass',
          'description': null,
          'cover': null,
          'genre': 'Progressive Breaks',
          'tags': ['anthem','dark','modpug','robotic'],
          'year': 2001,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'catNum': 'FF0010',
          'artist': 'PilFORM',
          'title': 'Beat Back',
          'description': null,
          'cover': null,
          'genre': 'Breaks',
          'tags': ['modpug','robotic'],
          'year': 2001,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'catNum': 'FF0011',
          'artist': 'PilFORM',
          'title': 'I\'ve Seen Things',
          'description': null,
          'cover': null,
          'genre': 'Breaks',
          'tags': ['dark','modpug','robotic'],
          'year': 2001,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'catNum': 'FF0012',
          'artist': 'PilFORM',
          'title': 'God Damn Noise',
          'description': null,
          'cover': null,
          'genre': 'Breaks',
          'tags': ['dark','modpug','robotic'],
          'year': 2001,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'catNum': 'FF0013',
          'artist': 'PilFORM',
          'title': 'Dedicated To The Dj',
          'description': null,
          'cover': null,
          'genre': 'Breaks',
          'tags': ['modpug','robotic'],
          'year': 2001,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        }
      ]
    };

    setTimeout(function() {
      if(callbackFunc != null) {
        callbackFunc.call(this, catalogData);
      }
    }, 100);
  }
};
