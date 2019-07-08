'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    try {
      const model = await this.ctx.model_promise;
      console.log('index model ==> ', model);

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
