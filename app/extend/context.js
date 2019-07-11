/**
 * 远程导入统一的 sequelize models 配置
 */
'use strict';
const LoadUtil = require('../utils/load-util');

// 虚拟模型缓存的 key
const MOCKMODEL = Symbol('Context#mock#model');

module.exports = {
  get model_promise() {
    if (!this[MOCKMODEL]) {
      this[MOCKMODEL] = LoadUtil.loadRemoteModels(this.app);
    }
    return this[MOCKMODEL];
  },
  get model() {
    return this.app.model;
  },
};
