'use strict';
const LoadUtil = require('../utils/load-util');

const task = async ctx => {
  /**
   * 1. 通过版本接口，获取 `egg-models-export` 的模型更新版本
   *    `app.config.modelsImport.version` 获取了默认的 `数据核心` 版本
   *    若 `数据核心` 并未配置版本号, 将会获取默认版本: {code: `fake version` [,interval] [,cron] }
   * 2. 比对当前分支项目的模型版本
   * 3. 若不一致，则更新数据模型，并更新至最新版本
   */
  const { app } = ctx;
  // if (app.egg_models_update_wait) {
  //   console.log(`[egg-models-import] 定时器, 更新版本状态[${app.egg_models_update_wait}], 暂时不用加载...`);
  // } else {
  //   console.log('[egg-models-import] 定时器, 加载版本...');
  //   await LoadUtil.loadDataVersion(app);
  // }

  // 模型并没有等待更新时, 才会尝试从数据核心加载版本
  if (!app.egg_models_update_wait) {
    await LoadUtil.loadDataVersion(app);
  }
};

module.exports = app => {
  // console.log('[egg-models-import] schedule 载入定时器 ... ');
  const checkVersion = app.config.modelsImport.modelExport.checkVersion || {};
  // 设置计时器配置类型
  checkVersion.type = 'all';
  // 定时器的启用状态
  checkVersion.disable = !app.config.modelsImport.modelExport.checkVersion ? true : !!checkVersion.disable;
  if (!checkVersion.interval && !checkVersion.cron) {
    // 未检测到任何时间配置时
    checkVersion.interval = 5 * 1000; // 默认情况下每10分钟检测一次版本
  }
  console.log('[egg-models-import] schedule checkVersion => ', checkVersion);

  // 返回定时器任务部分
  return {
    schedule: {
      ...checkVersion,
    },
    task,
  };
};
