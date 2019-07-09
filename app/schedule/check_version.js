'use strict';

exports.schedule = {
  type: 'worker',
  interval: '10m',
  // immediate: true,
};

exports.task = async ctx => {
  // 1. 通过版本接口，获取 `egg-models-export` 的模型更新版本
  // 2. 比对当前分支项目的模型版本
  // 3. 若不一致，则更新数据模型，并更新至最新版本
  console.log(ctx);
};
