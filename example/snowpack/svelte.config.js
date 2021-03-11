module.exports = {
  preprocess: require('../../dist/index.js').preprocess({
    silent: false,
    debug: true,
    safeList: ["bg-purple-500"],
    compile: false,
    config: 'windi.config.js',
    prefix: 'windi-',
  }),
};
