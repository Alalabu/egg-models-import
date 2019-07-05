'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    try {
      // const models = this.ctx.model;
      // console.log('index Object.keys(this.ctx) ==> ', Object.keys(this.ctx));
      // console.log('index models ==> ', await this.ctx.model_promise);
      // const model = await this.ctx.model_promise;
      // console.log('client.findAll -> ', await model.client.findAll({ limit: 2 }));

      const model = await this.ctx.model_promise;
      // console.log('client.findAll -> ', await model.client.findAll({ limit: 2, raw: true }));
      // console.log('model: ', this.ctx.model_promise.address.findAll({ limit: 1, raw: true }));

      console.log('index model ==> ', model);
      // console.log('index model_aaa ==> ', this.ctx.model_aaa);
      // console.log('index model_bbb ==> ', this.ctx.model_bbb);
      // console.log('index app.model_aaa ==> ', this.ctx.app.model_aaa);
      // console.log('index app.model_bbb ==> ', this.ctx.app.model_bbb);
      // console.log('index app.model_ccc ==> ', this.ctx.app.model_ccc);

      ctx.body = {
        plugin_name: `hi,  ${this.app.plugins.modelsImport.name}`,
        // models,
      };
    } catch (error) {
      console.error(error);
      ctx.body = { err: 101, msg: error };
    }
  }
}

module.exports = HomeController;
