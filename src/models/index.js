require('fs')
  .readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.includes('.'))
  .map(filename => { // eslint-disable-line
    const moduleName = filename.split('.')[0];
    exports[moduleName] = require(`${__dirname}/${filename}`);
  });
