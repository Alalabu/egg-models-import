'use strict';
const path = require('path');

module.exports = {
  modelsImport: {
    enable: false,
    // package: 'egg-models-import',
    path: path.join(__dirname, '../../../../../egg-models-import'),
  },
};
