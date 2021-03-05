module.exports = {
  preprocess: require('../../dist/index.js').preprocess({
    silent: false,
    debug: true,
    compile: false,
    config: 'tailwind.config.js',
    prefix: 'windi-',
  }),
};
