const CatalogData = new function() {
  const self = this;

  self.getCatalogData = function(callbackFunc) {
    const catalogData = {
      'releases': [
        {
          'type': 'compilation',
          'catNum': 'FFC001',
          'artist': 'PillFORM',
          'title': 'Refried 99\'',
          'description': 'The electro bass collection that started it all',
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['dark','experimental','robotic'],
          'year': 1999,
          'compilationId': null,
          'url': 'http://www.funkinfamily.com'
        },
        {
          'type': 'compilation',
          'catNum': 'FFC002',
          'artist': 'PillFORM',
          'title': 'Revive',
          'description': 'Rivived tracks from the early days from 1999-2001 and released',
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['dark','modplug'],
          'year': 2003,
          'compilationId': null,
          'url': 'http://www.funkinfamily.com'
        },
        {
          'type': 'single',
          'catNum': 'FF0001',
          'artist': 'PillFORM',
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
          'type': 'single',
          'catNum': 'FF0002',
          'artist': 'PillFORM',
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
          'type': 'single',
          'catNum': 'FF0003',
          'artist': 'PillFORM',
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
          'type': 'single',
          'catNum': 'FF0004',
          'artist': 'PillFORM',
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
          'type': 'single',
          'catNum': 'FF0005',
          'artist': 'PillFORM',
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
          'type': 'single',
          'catNum': 'FF0006',
          'artist': 'PillFORM',
          'title': 'Turn Up The Bass',
          'description': null,
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['modplug','robotic'],
          'year': 1999,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'type': 'single',
          'catNum': 'FF0007',
          'artist': 'PillFORM',
          'title': 'Inner Robot',
          'description': null,
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['dark','modplug','robotic'],
          'year': 1999,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'type': 'single',
          'catNum': 'FF0008',
          'artist': 'PillFORM',
          'title': 'Mod-Rhythm',
          'description': null,
          'cover': null,
          'genre': 'Electro Bass',
          'tags': ['dark','modplug','robotic'],
          'year': 1999,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'type': 'single',
          'catNum': 'FF0009',
          'artist': 'PillFORM',
          'title': 'Techno Bass',
          'description': null,
          'cover': null,
          'genre': 'Progressive Breaks',
          'tags': ['anthem','dark','modplug','robotic'],
          'year': 2001,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'type': 'single',
          'catNum': 'FF0010',
          'artist': 'PillFORM',
          'title': 'Beat Back',
          'description': null,
          'cover': null,
          'genre': 'Breaks',
          'tags': ['modplug','robotic'],
          'year': 2001,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'type': 'single',
          'catNum': 'FF0011',
          'artist': 'PillFORM',
          'title': 'I\'ve Seen Things',
          'description': null,
          'cover': null,
          'genre': 'Breaks',
          'tags': ['dark','modplug','robotic'],
          'year': 2001,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'type': 'single',
          'catNum': 'FF0012',
          'artist': 'PillFORM',
          'title': 'God Damn Noise',
          'description': null,
          'cover': null,
          'genre': 'Breaks',
          'tags': ['dark','modplug','robotic'],
          'year': 2001,
          'compilationId': 'FFC002',
          'url': 'http://www.funkinfamily.com'
        },
        {
          'type': 'single',
          'catNum': 'FF0013',
          'artist': 'PillFORM',
          'title': 'Dedicated To The Dj',
          'description': null,
          'cover': null,
          'genre': 'Breaks',
          'tags': ['modplug','robotic'],
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
