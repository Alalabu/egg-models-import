# egg-models-import

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-models-import.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-models-import
[travis-image]: https://img.shields.io/travis/eggjs/egg-models-import.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-models-import
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-models-import.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-models-import?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-models-import.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-models-import
[snyk-image]: https://snyk.io/test/npm/egg-models-import/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-models-import
[download-image]: https://img.shields.io/npm/dm/egg-models-import.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-models-import

<!--
Description here.
-->

## 使用场景

1. 很多时候我们的项目是这样的，根据数据库生成数据模型 `Model` ，业务部分 `Services` 通过访问数据模型 `Model` 来进行业务数据交互。
![](https://sheu-huabei5.oss-cn-huhehaote.aliyuncs.com/bho/egg-models-xxx%2001.jpg)

2. 在有些情况下，项目结构也许是这个样子的：由于终端可能不同，项目也可能不同，但数据模型部分却是一致的。A、B、C三个项目公用一个数据库，也很正常。

![](https://sheu-huabei5.oss-cn-huhehaote.aliyuncs.com/bho/egg-models-xxx%2002.jpg)

- 此时，项目组之间就会出现这样的问题：一旦数据模型变更，所需变更改动的地方就是**所涉及的项目总数**。

## 插件设计理念
- 本插件是 ~~为了防止世界被破坏~~，为了减少功能变动或设计变动所导致的 `Model` 部分多次改动(人工改动必然会增加错误率)，为了降低项目结构的耦合。

## 插件运行流程
- 将数据模型文件部分做为独立项目运行，其他**关联项目**在启动时，异步访问**数据模型项目**，根据解析结果生成虚拟**sequelize models**。
![](https://sheu-huabei5.oss-cn-huhehaote.aliyuncs.com/bho/egg-models-xxx%2003.jpg)

- 插件分为两部分：`egg-models-import` 和 `egg-models-export`。顾名思义，前者是**导入**行为，**关联项目**所需使用的，用于异步加载并生成数据模型缓存；后者是**导出**行为，**数据模型项目**所需的，用于对外提供远程接口，根据真实的数据模型，为**关联项目**提供模型解析方案。

## egg-models-export 配置
请到 [egg-models-export](https://github.com/Alalabu/egg-models-export) 查看详细配置项说明。

## egg-models-import 配置

### 依赖的插件

- ~~egg-sequelize：`^4.3.1` (1.0.5前)~~
- egg-sequelize：`^5.1.0` (1.0.6+)
- request：`^2.88.0`
- mysql2：`^1.6.5`
- moment：`^2.24.0`

### 1. 安装

```bash
$ npm i egg-models-import --save
```

### 2. 开启插件

```js
// config/plugin.js
exports.modelsImport = {
  enable: true,
  package: 'egg-models-import',
};
```

### 3. 配置插件
```javascript
// config/config.{dev}.js
'use strict';

module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_xxxxxxxx';

  // modelsImport
  config.modelsImport = {
    modelExport: {
	  // 这里所配置的, 是你的 egg-models-export 项目访问方式
      modelHost: 'http://127.0.0.1:7001/',
	  // 鉴权时所需的 key
	  authKey: 'project-1',
	  // 鉴权时所需的 secret
      authSecret: '68b5dfc0-4c82-11e9-81c9-73dbcff02bd1',
    },
	// 此处是正常的 sequelize 配置
    sequelize: {
      dialect: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      database: 'yourdatabase',
      username: 'username',
      password: 'password',
      timezone: '+08:00',
      pool: {
        max: 10,
        min: 0,
        idle: 10000,
        acquire: 20000,
        evict: 30000,
      },
      retry: { max: 3 },
      logging(sql) {
        // 数据库语句执行打印日志
        console.log('【SQL】 => ', sql);
      },
    },
  };

  return {
    ...config,
  };
};
```
### 4. 模型访问 (1.0.7更新model挂载方式)
```js
'use strict';

const {Service} = require('egg');

class TestService extends Service {
  async index() {
    const { ctx } = this;
	// 实现了无缝挂载，旧项目载入插件可即插即用
    const clients = await ctx.model.client.findAll({ limit: 2, raw: true });

    return { clients };
  }
}

module.exports = TestService;
```
## 历史版本
> `1.0.7` ：
> 1. 隐藏了 `ctx.model_promise` 的挂载方式，直接将从**数据核心**获取的 `models` 挂载至 `ctx.model`，以便旧项目无缝使用。
>
> `1.0.6` ：
> 1. 新增 对**数据核心**多库的支持；
> 2. 修复 无法通过 `model.query` 进行原始查询的问题;
> 3. 变更 `egg-sequelize` 的支持版本从 `4.3.1` 到 `5.1.0`;
> 
> `1.0.5` ：
> 1. 新增 对**数据核心**鉴权的支持，通过插件配置 `authKey` 和 `authSecret`，获取**数据核心**配置的数据生成缓存模型;
> 2. 修复 其他问题;


## 提问交流

请到 [egg issues](https://github.com/eggjs/egg/issues) 异步交流。
