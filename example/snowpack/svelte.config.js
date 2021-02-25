module.exports = {
  preprocess: require('svelte-windicss-preprocess').preprocess({
    silent: false,
    debug: true,
    compile: true,
    config: 'tailwind.config.js',
    prefix: 'windi-',
    globalUtility: true,
  }),
};
