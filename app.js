'use strict';

class AppBootHook {

  constructor(app) {
    this.app = app;
  }

  async didLoad() {
    // 获取 ctx 对象
    const app = this.app;
    const ctx = app.createAnonymousContext();
    if (ctx.model_promise) {
      // 将缓存的 model_promise 挂载至 app.model
      app.model = await ctx.model_promise;
    }
  }
}

module.exports = AppBootHook;
