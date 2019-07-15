/**
 * 格式化名称专用
 */
'use strict';
/**
 * 将带下划线的字符串转换为 大驼峰命名 字符串
 * @param {*} str 原始字符串
 */
const underToBigCamelCase = str => {
  if (!str) return str;
  return str.split('_').map(s => {
    return s ? (s[0].toUpperCase() + s.substring(1, s.length)) : '';
  }).join('');
};

/**
 * 将带下划线的字符串转换为 小驼峰命名 字符串
 * @param {*} str 原始字符串
 */
const underToLittleCamelCase = str => {
  if (!str) return str;
  let wordIndex = 0;
  return str.split('_').map((s, i) => {
    if (!s) {
      wordIndex++;
      return '';
    }
    return i > wordIndex ? (s[0].toUpperCase() + s.substring(1, s.length)) : s.toLowerCase();
  }).join('');
};

module.exports = {
  underToBigCamelCase,
  underToLittleCamelCase,
  normal: str => str,
};
