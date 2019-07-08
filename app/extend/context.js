/**
 * 远程导入统一的 sequelize models 配置
 */
'use strict';
const Sequelize = require('sequelize');
const moment = require('moment');
const HttpClient = require('../utils/http-client');

/**
 * 函数用于加载远程的 sequelize models
 * @param {*} sequelize 参数部分是 sequelize 实例，经由用户进行配置
 */
const loadRemoteModels = async (sequelize, modelHost, modelIn, modelAttrs, authKey, authSecret) => {
  try {
    // 1. 从外部动态获取 models 列表
    const sequelize_models = await HttpClient.$http(`${modelHost}${modelIn}`, 'POST', { authKey, authSecret });
    if (!Array.isArray(sequelize_models)) {
      return console.error('\x1B[31m%s\x1B[39m', '【ERROR】 egg-model-export load error: ', sequelize_models);
    }
    // 界面展示
    console.log('\x1B[33m%s\x1b[0m', '【egg-models-import】BEGIN 〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓');
    console.log('\x1B[31m%s\x1B[39m', '【egg-models-import】IMPORT TABLES：');
    sequelize_models.forEach(t => {
      console.log(t);
    });
    console.log('\x1B[33m%s\x1b[0m', '【egg-models-import】END 〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓');
    // Sequelize 数据类型(重命名)
    const DataTypes = Sequelize;
    const MockModel = sequelize; // {}; // 虚拟配置的 Model
    const AssModels = []; // 关联模型数组
    // 遍历模型(对象), 获取模型属性及关联关系
    for (const model_name of sequelize_models) {
      // 远程获取模型属性(及关联关系数据)
      const model_res = await HttpClient
        .$http(`${modelHost}${modelAttrs}`, 'POST', { tableName: model_name, authKey, authSecret });
      // 缓存的临时模型
      const model_tmp = {};
      // 该模型的时间字段数组, 后续对时间字段做统一格式化定义
      const dateKeys = [];
      /**
       * 模型数据包含两部分内容:
       * 1. [attrs]: 描述该模型的属性部分,如字段名、类别等
       * 2. [associations]: 关联关系部分,描述多模型关系
       */
      const { attrs, associations } = model_res;
      // 遍历属性部分
      attrs.forEach(ele => {
        // console.log(`${model_name} attrs => `, ele);
        const val = {};
        // 如果是主键
        if (ele.primaryKey) val.primaryKey = true;
        // 默认值, 主要对于日期默认值进行筛选
        if (ele.defaultValue) {
          val.defaultValue = (ele.type === 'DATE' && ele.defaultValue === 'NOW') ?
            DataTypes.NOW : ele.defaultValue;
        }
        // 设置属性类别
        val.type = DataTypes[ele.type];
        // 如果类别是 日期(DATE)
        if (ele.type === 'DATE') {
          // 记录日期字段, 稍后通过 moment 进行时区格式化
          dateKeys.push(ele.name);
        }
        model_tmp[ele.name] = val;
      });
      // 模型名字
      const SequelizeModelName = model_name;
      // 通过 sequelize.define 定义模型
      // 通过 sequelize 生成模型实例
      // console.log(`${model_name} loading...`, model_tmp);
      const m = sequelize.define(model_name, model_tmp,
        { tableName: model_name, timestamps: false });
      // 将每一个模型实例挂载到虚拟对象 [MockModel] 中
      MockModel[model_name] = m;
      // console.log(`${model_name} done...`);

      // 添加对象关系
      if (Array.isArray(associations) && associations.length > 0) {
        const thisModel = { model: SequelizeModelName };
        thisModel.associations = associations;
        AssModels.push(thisModel);
      }

      // 日期字段解析
      dateKeys.forEach(function(k) {
        // 如果字段是日期，则对字段通过 moment 格式化
        Object.defineProperty(m, k, {
          get() {
            return moment(this.getDataValue(k)).format('YYYY-MM-DD HH:mm:ss');
          },
        });
      });

    } // for (const model_name of sequelize_models)

    // 模型关联关系遍历挂载
    AssModels.forEach(modelOnce => {
      modelOnce.associations.forEach(assEntry => {
        const { associationAccessor, associationType, foreignKey, targetKey, as } = assEntry;
        const assFn = associationType[0].toLowerCase() + associationType.substring(1, associationType.length);
        // 动态填充模型对象关联关系
        MockModel[modelOnce.model][assFn](
          MockModel[associationAccessor], { foreignKey, targetKey, as }
        );
      });
    });

    return MockModel;
  } catch (error) {
    console.error(error);
    return {};
  }
};

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
      this[MOCKMODEL] = loadRemoteModels(_sequelize, modelHost, modelIn, modelAttrs, authKey, authSecret);
    }
    return this[MOCKMODEL];
  },
};
