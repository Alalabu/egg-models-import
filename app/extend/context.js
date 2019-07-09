/**
 * 远程导入统一的 sequelize models 配置
 */
'use strict';
const Sequelize = require('sequelize');
const LoadUtil = require('../utils/load-util');

// console.log('【extend/context】 => 正在加载并合并数据模型...');
// 虚拟模型缓存的 key
const MOCKMODEL = Symbol('Context#mock#model');

module.exports = {
  get model_promise() {
    if (!this[MOCKMODEL]) {
      // console.log('[PLUGIN] egg-models-import load...');
      /**
       * 通过配置对象获取 2 个主要配置
       * 1. modelExport: 导出模型的配置
       * 2. sequelize: sequelize的配置
       */
      const { modelExport, sequelize } = this.app.config.modelsImport;
      const { modelHost, modelIn, modelAttrs, authKey, authSecret } = modelExport;
      const { dialect, host, port, database, username, password, timezone, pool, retry, logging } = sequelize;
      const _sequelize = new Sequelize(database, username, password, {
        dialect, host, port, timezone, pool, retry, logging,
      });
      this[MOCKMODEL] = LoadUtil.loadRemoteModels(_sequelize, modelHost, modelIn, modelAttrs, authKey, authSecret);
    }
    return this[MOCKMODEL];
  },
  get model() {
    // ctx.model = app.model
    return this.app.model;
  },
};
