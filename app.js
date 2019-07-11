'use strict';

class AppBootHook {

  constructor(app) {
    this.app = app;
  }

  async didLoad() {
    // 获取 ctx 对象
    console.log('[egg-models-import] app.js didLoad... ');
    const app = this.app;
    const ctx = app.createAnonymousContext();
    if (ctx.model_promise) {
      // 将缓存的 model_promise 挂载至 app.model
      const remoteModelsRes = await ctx.model_promise;
      if (remoteModelsRes.err) {
        // 载入数据出错
        return console.error('[egg-models-import] ERROR app.js -> ', remoteModelsRes);
      }
      const { mockModel, version } = remoteModelsRes;
      const modelsImport = app.config.modelsImport; // egg-models-import 配置对象
      modelsImport.version = version; // 为缓存的配置对象，设置【缓存模型】的版本
      app.model = mockModel; // 为 app.model 挂载虚拟模型值

      /**
       * 监听模型更新事件，以便在某进程更新 model 时更新当前进程
       * (放弃) model作为复杂对象, 无法发送给其他 app (error: Converting circular structure to JSON)
       */
      // app.messenger.on('#egg#models#updateModels', ({ model, version }) => {
      //   app.coreLogger.info(`APP [${app.id}] 接收到新的模型和版本: ${version.code} - ${JSON.stringify(model)}`);
      //   app.model = model;
      //   modelsImport.version = version;
      // });

    }
  } // async didLoad()
}

module.exports = AppBootHook;
