/**
 * 用于请求外部接口的封装
 */
'use strict';
const request = require('request');

const http = (url, method, reqData) => new Promise((resolve, reject) => {
  const options = {
    url,
    method,
    // headers: {},
    // body: {}
  };
  if (method === 'POST') {
    // eslint-disable-next-line no-sequences
    options.json = true,
    options.headers = {
      'content-type': 'application/json',
    };
    options.body = reqData; // JSON.stringify(reqData);
  }
  // console.log('options:: ', options);
  // 请求微信接口
  request(options, function(err, response, data) {
    // console.log('得到网络请求结果...');
    // 解析返回结果
    const result_data = typeof data === 'string' ? JSON.parse(data) : data;
    if (!err && response.statusCode === 200) {
      return resolve(result_data);
    }
    reject(result_data);
  }); // end: request
});

const $get = url => http(url, 'GET');
const $post = url => http(url, 'POST');
const $http = http;

module.exports = {
  $get, $post, $http,
};
