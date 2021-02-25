module.exports = {
  preprocess: require('../../dist/index.js').preprocess({
    silent: false,
    debug: true,
    compile: true,
    config: 'tailwind.config.js',
    prefix: 'windi-',
    globalUtility: true,
  }),
};
