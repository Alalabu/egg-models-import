'use strict';

const mock = require('egg-mock');

describe('test/models-import.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/models-import-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      // .expect('hi, modelsImport')
      // .expect(200)
      .then(res => {
        // console.log('res => ', res);
        console.log('res text => ', res.text);
        console.log('res body => ', res.body);
      });
  });
});
