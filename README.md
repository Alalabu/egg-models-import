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

- 插件分为两部分：`egg-models-import` 和 `egg-models-export`。顾名思义，前者是**导入**行为，**关联项目**所需使用的，用于异步加载并生成数据模型缓存；后者是**导出**行为，**数据核心项目**所需的，用于对外提供远程接口，根据真实的数据模型，为**分支关联项目**提供模型解析方案。

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
> 在分支项目中, 切勿开启插件 `egg-sequelize` ,由于加载模型时机不同，`egg-sequelize` 依赖于项目本地的模型文件，同时开启会产生冲突。

```js
// config/plugin.js
module.exports = {
  modelsImport: {
    enable: true,
    package: 'egg-models-import',
  }
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
	  // 数据核心 egg-models-export 项目访问方式
	  // 简单模式下，配置 modelHost 即可运行
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
> 1.0.82 更新了模型挂载时，模型名字的**格式化**方式。默认情况下，模型名与数据库表名一致。`1.0.82` 提供了将模型名(默认的下划线命名方式)转换为 **大/小驼峰** 命名方式。
> 在配置文件 `config.{dev}.js` 可添加 `nameFormat` 属性，配置如下：
> - **big-camel**：大驼峰命名，如 `SystemUser`；
> - **little-camel**：小驼峰命名，如 `systemUser`；
> - **normal 或未填写**：默认命名，如 `system_user`；

```javascript
// config/config.{dev}.js

// modelsImport
config.modelsImport = {
    modelExport: {
		...
		nameFormat: 'big-camel', // little-camel | normal
	｝
｝
```

## 5. 热更新 (1.0.8新增)
通常，在 **测试阶段** 或者 **极端的生产环境** 中，我们可能需要：
> 1. 更新 **数据核心** 的数据模型；
> 2. 在适当的时候，重启 **业务分支** 或者，业务分支不做任何动作，便可以更新分支缓存的数据模型。

#### 5.1 在 **分支** 启动时，首次获取 **数据核心** 所描述的虚拟数据版本。
![](https://sheu-huabei5.oss-cn-huhehaote.aliyuncs.com/bho/%E7%83%AD%E6%9B%B4-01-%E9%A6%96%E6%AC%A1%E8%8E%B7%E5%8F%96%E7%89%88%E6%9C%AC.jpg)
- 若无需鉴权, 则直接配置于 modelsExport 

```js
// 数据核心 (安装了egg-models-export,并装载实体数据文件的应用)
// config/config.{dev}.js

config.modelsExport = {
    version: {
      code: '1.0.0',
      cron: '0 0 */3 * * *',
    },
}
```
- 若多角色核心，则将版本配置于 `auth` 组的角色对象中。

```js
// 数据核心 (安装了egg-models-export,并装载实体数据文件的应用)
// config/config.{dev}.js

config.modelsExport = {
    auth: [
      {
        version: {
          code: '2.0.0',
          interval: 60000,
        },
        key: 'haiou',
        delegate: 'model_s',
        secret: '7825dfc0-4c82-11e9-81c9-73dbcff02a31',
      }, {
        version: {
          code: '3.0.5',
          interval: '3m',
        },
        key: 'xiaofei',
        delegate: 'model',
        secret: '68b5dfc0-4c82-11e9-81c9-73dbcff02bd1',
      },
    ],
}
```
> `version` 对象有三个属性:
> - *code* `[String]` 版本号
> - *interval* `[String | Number]` 字符串或数字类型的执行时机，字符串类型时仅支持后缀为 **时、分、秒** 的关键字：**h、m、s**；数字类型时表示一个毫秒数。`interval`与`cron`只能配置一个，若同时存在则 `interval` 优先级较大。
> - *cron* `[String]` 表示执行时机的 cron 表达式。
>  
> 注意: `interval` 与 `cron` 所表示的是，**分支项目获取新版本时，在多久之后执行 虚拟模型 替换。将在替换前执行一个 `setTimeout` 计时器。**

#### 5.2 如果项目需要热更，则应该配置 **检查核心版本** 的插件定时器。
![](https://sheu-huabei5.oss-cn-huhehaote.aliyuncs.com/bho/%E7%83%AD%E6%9B%B4-02-%E5%AE%9A%E6%97%B6%E8%AF%B7%E6%B1%82%E7%89%88%E6%9C%AC.jpg)
```js
// 分支项目 (安装了 egg-models-import 的应用)
// config/config.{dev}.js

config.modelsImport = {
    modelExport: {
      // 其他配置...

      // 热更检查时机
      checkVersion: {
        // disable: false, 
        // interval: 10000,
        cron: '*/10 * * * * *',
      },
    },
    sequelize: {
		// ...
	}
}
```
> 若配置有 `checkVersion` 对象, 则可以开启一个用于检查 **数据核心** 所描述的数据版本的 **定时任务**。
> `disable` 表示定时任务的禁用状态。
> `interval` 或 `cron` 表示检查版本定时任务的执行时机。

#### 5.3 热更过程
- **数据核心** 在 **分支** 获取虚拟模型后，可随时进行关闭，并调整新的模型（如更新现有模型的属性、关系，或增加新的模型文件）。
- 在 **更新模型** 行为结束后，需 **将模型版本号 `version.code` 配置为新的标识**，**分支** 在检查版本时若发现 **不一样的版本号** ，则对当前进程中的虚拟数据进行热更新。
- 为避免影响线上业务，可在 **数据核心** 的 `version` 中设置更新时机，规避业务高峰。

## 6. 操作符别名 operatorsAliases
在 `Sequelize v5` 中为了安全起见 ( [详见operators-security](http://docs.sequelizejs.com/manual/querying.html#operators-security) )，禁用了历史版本中操作符的定义。为了更好的向上兼容，默认情况下 `egg-models-import` 添加了原有的操作符名：
``` js
const Op = Sequelize.Op;
// sequelize v5 operators aliases
const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col,
};
```
若希望更安全的使用操作符，可以禁用默认别名：
```js
// config/config.{dev}.js

config.modelsImport = {
    modelExport: {
      // 其他配置...

      // 禁用操作符别名
      operAliases: false,
    },
    sequelize: {
		// ...
	}
}
```

## 历史版本
> `1.0.83` ：
> 1. 为了更好的兼容 `v4` 版本，添加了默认的操作符别名配置 `config.modelsImport.modelsExport.operAliases`，配置值为 `false` 时将不使用默认的操作符别名，而采用手动控制。
> 
> `1.0.82` ：
> - 新增 生成模型时的模型名格式多样化表现，添加了下划线命名转换“大/小驼峰命名”的配置；详情见 ** 4.模型访问 **
> 
> `1.0.81` ：
> - 修复了简洁模式下的几个严重bug；
> 
> `1.0.8` ：
> 1. 新增 数据热更新模式；
> 2. 微调 现有执行过程；
> 
> `1.0.7` ：
> - 隐藏了 `ctx.model_promise` 的挂载方式，直接将从**数据核心**获取的 `models` 挂载至 `ctx.model`，以便旧项目无缝使用。
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
