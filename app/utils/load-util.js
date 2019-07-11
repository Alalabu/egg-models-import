'use strict';
const Sequelize = require('sequelize');
const moment = require('moment');
const cronParser = require('cron-parser');
const HttpClient = require('./http-client');

/**
 * 函数用于加载远程的 sequelize models
 * @param {Object} sequelize 是 sequelize 实例，经由用户进行配置
 * @param {String} modelHost 是访问数据核心的主机地址
 * @param {String} modelIn 是访问数据核心入口的 web api
 * @param {String} modelAttrs 是访问数据表配置(属性、关系)的 web api
 * @param {String} authKey 是用户授权的 key
 * @param {String} authSecret 是用户授权的 value
 */
// const loadRemoteModels = async (sequelize, modelHost, modelIn, modelAttrs, authKey, authSecret) => {
const loadRemoteModels = async app => {
  try {
    // 1. 获取配置信息
    const modelsImport = app.config.modelsImport; // 插件配置
    const _sequelize = modelsImport.sequelize;
    const modelExport = modelsImport.modelExport;
    const { modelHost, modelIn, modelAttrs, authKey, authSecret } = modelExport;
    const { dialect, host, port, database, username, password, timezone, pool, retry, logging } = _sequelize;
    const sequelize = new Sequelize(database, username, password, {
      dialect, host, port, timezone, pool, retry, logging,
    });
    // 2. 从外部动态获取 models 列表
    const modelInRes = await HttpClient.$http(`${modelHost}${modelIn}`, 'POST', { authKey, authSecret });
    if (modelInRes.err) {
      console.error('加载数据核心异常: ', modelInRes);
      return modelInRes;
    }
    const sequelize_models = modelInRes.dataKeys; // 数据表的键集合
    const modelVerion = modelInRes.version; // 数据核心版本
    if (!Array.isArray(sequelize_models)) {
      return console.error('\x1B[31m%s\x1B[39m', '【ERROR】 egg-model-export load error: ', sequelize_models);
    }
    // 界面展示
    console.log('\x1B[33m%s\x1b[0m', '【egg-models-import】BEGIN 〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓');
    console.log('\x1B[31m%s\x1B[39m', `【egg-models-import】IMPORT TABLES [version=${modelVerion.code}]：`);
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
    // 返回虚拟模型[model], 以及数据模型版本[version]
    return { mockModel: MockModel, version: modelVerion };
  } catch (error) {
    console.error(error);
    return { err: error, msg: '数据核心载入错误!' };
  }
};

/**
 * 用于时间转换的函数
 * @param {TimeObject} t {interval: 简单时间, cron: cron格式时间}
 */
const timePaser = ({ interval, cron }) => {
  const defaultInterval = 10 * 60 * 1000;
  if (interval) {
    if (Number.isSafeInteger(interval) && interval > 10 * 1000) {
      // 安全范围时间, 并且时间大于 10 秒, 则直接使用 interval
      return interval;
    } else if (typeof interval === 'string') {
      // 如果 interval 是一个字符串, 则必须是 数字 + [h | m | s] 组合
      const num = Number(interval.substring(0, interval.length - 1)),
        suffix = interval[interval.length - 1];
      if (!Number.isSafeInteger(num)) {
        // 若 num 不是有效数字, 则返回默认更新时机
        return defaultInterval;
      }
      switch (suffix) {
        case 'h': return num * 60 * 60 * 1000;
        case 'm': return num * 60 * 1000;
        case 's': return num * 1000;
        default : defaultInterval;
      }
    }
  } else if (cron) {
    // cron 格式则通过 cron-parser 进行时间转换
    const now = new Date();
    const future = new Date(cronParser.parseExpression(cron).next().toString());
    const result = future - now;
    return result;
  }
  // 返回默认执行时机: 10分钟后
  return defaultInterval;
};

/**
 * 刷新模型
 * @param {Object} app Application
 */
const reflushModels = async app => {
  try {
    const newModels = await loadRemoteModels(app);
    if (newModels.err) {
      throw '[egg-models-import] reflushModels ERROR: ' + newModels.err;
    }
    app.model = newModels.mockModel;
    // 更新其他 app 的 model + version
    // app.messenger.sendToApp('#egg#models#updateModels', { model: newModels.mockModel, version: newModels.version });
    // 取消更新状态
    if (!newModels.err && app.egg_models_update_wait) {
      app.egg_models_update_wait = null;
    }
  } catch (error) {
    if (app.egg_models_update_wait) {
      app.egg_models_update_wait = null;
    }
    app.coreLogger.error('[egg-models-import] reflushModels Exception: ' + error);
    console.error(error);
  }
};

/**
 * 加载数据模型的版本
 * @param {Object} app Application
 */
const loadDataVersion = async app => {
  try {
    const modelExport = app.config.modelsImport.modelExport; // 插件配置
    const { modelHost, modelVersion, authKey, authSecret } = modelExport;
    const versionRes = await HttpClient.$http(`${modelHost}${modelVersion}`, 'POST', { authKey, authSecret });
    // console.log('[egg-models-import] 实时监测版本 versionRes: ', versionRes);
    if (!versionRes || versionRes.err) {
      throw `loadDataVersion() error [versionRes => ${JSON.stringify(versionRes)}]`;
    }
    // 对比版本
    if (versionRes.code && app.config.modelsImport.version && app.config.modelsImport.version.code !== versionRes.code) {
      const execInterval = timePaser({ ...versionRes }); // 获取执行更新时机的毫秒数
      console.log(`[egg-models-import] 实时监测版本, 将会在 [${execInterval}ms] 之后进行更新!`);
      // 更新缓存中的预设版本
      app.config.modelsImport.version = versionRes;
      // 设置 execInterval 时间后执行重新更新 models
      app.egg_models_update_wait = setTimeout(reflushModels, execInterval, app);
    }
    // else {
    //   console.log('[egg-models-import] 实时监测版本,无需进行更新!!');
    // }
  } catch (error) {
    if (!error) {
      console.error('[egg-models-import] ERROR: 服务器无法检测...');
    } else {
      console.error('[egg-models-import] ERROR: ', error);
    }
  }
};

module.exports = {
  loadRemoteModels, loadDataVersion,
};
