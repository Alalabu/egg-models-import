'use strict';

module.exports = app => {

  app.model_keys = 'abc12345';

  // app.beforeStart(async () => {
  //   console.log('这是插件里的 app 哦 -> ', app);
  //   if (app.model_promise) {
  //     console.log('挂载 model ...');
  //     // const ctx = app.createAnonymousContext();
  //     // ctx.model = await app.model_promise;
  //     app.model = await app.model_promise;
  //     console.log('挂载 model 结束...');
  //   }
  // });
  // console.log('这是插件里的 app.context -> ', Object.keys(app));
  // if(app.model_promise){
  //   app
  // }
};
