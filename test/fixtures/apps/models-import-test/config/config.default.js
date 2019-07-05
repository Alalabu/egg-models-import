'use strict';

// exports.keys = '123456';
module.exports = () => {
  const config = {};
  config.keys = '123456';

  config.modelsImport = {
    url: 'mysql://asdasdasd',
  };

  console.log('egg-models-import pulgin load...');
  return {
    ...config,
  };
};
