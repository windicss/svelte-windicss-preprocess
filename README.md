# svelte-windicss-preprocess

A svelte preprocessor for [windicss](https://github.com/windicss/windicss). Windi CSS is a next generation utility-first CSS framework.

If you are already familiar with [Tailwind CSS](https://tailwindcss.com/docs), think about Windi CSS as an on-demanded alternative to Tailwind, which provides faster load times, fully compatible with Tailwind v2.0 and with a bunch of additional cool features.

## ⚠️⚠️⚠️ SVELTE KIT ⚠️⚠️⚠️

For svelte-kit with vite please try to use our [vite-plugin](https://github.com/windicss/vite-plugin-windicss) first. This repo is meant for special use cases or bundler solution without SSR.

---

## Installation

<!-- gets replaced with https://next.windicss.org/play.html if public -->

> Now we have a great playground, you can [try it online](https://windicss.github.io/svelte-windicss-preprocess/) before installing it.

```sh
npm i -D svelte-windicss-preprocess
```

---

## Configuration

> Default Options shown below

```js
// svelte.config.js
module.exports = {
  preprocess: require('svelte-windicss-preprocess').preprocess({
    compile: false,
    prefix: 'windi-',
    verbosity: 1,
    debug: false,
    devTools: {
      completions: false,
    },
  }),
};
```

| option               | description                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------- |
| config               | string that represent the location of [windicss configuration](https://windicss.org)     |
| safeList             | array of classes windicss should include even if not used in markup                      |
| compile              | boolean wether windicss runs in [compilation or interpretion mode](https://windicss.org) |
| prefix               | class prefix if preprocessor is running in compilation mode                              |
| silent               | boolean of logging                                                                       |
| devTools             | object to configure optional windicss devTools                                           |
| devTools.enabled     | boolean to activate windi devtools in runtime                                            |
| devTools.completions | boolean to activate css class auto-completion in devtools                                |

## Integrations

<!-- ### [see guides](https://next.windicss.org/guide/integrations/svelte-preprocessor.html) can be found in windicss docs -->

### Vanilla Svelte

```js
// rollup.config.js
export default {
  // ...
  plugins: [
    svelte({
      // ...
      preprocess: [
        require('svelte-windicss-preprocess').preprocess({
          config: 'windi.config.js', // windi config file path (optional)
          compile: true, // false: interpretation mode; true: compilation mode (optional)
          prefix: 'windi-', // set compilation mode style prefix
          safeList: ['bg-gray-600', 'text-white'], // (optional)
        }),
      ],
    }),
  ],
  // ...
};
```

### Snowpack Svelte

```js
// svelte.config.js
module.exports = {
  preprocess: [
    require('svelte-windicss-preprocess').preprocess({
      config: 'windi.config.js', // windi config file path (optional)
      compile: true, // false: interpretation mode; true: compilation mode (optional)
      prefix: 'windi-', // set compilation mode style prefix
      safeList: ['bg-gray-600', 'text-white'], // (optional)
    }),
  ],
};
```

### Rollup Sapper

```js
// rollup.config.js
export default {
  client: {
    // ...
    plugins: [
      // ...
      svelte({
        // ...
        preprocess: [
          require('svelte-windicss-preprocess').preprocess({
            config: 'windi.config.js', // windi config file path (optional)
            compile: true, // false: interpretation mode; true: compilation mode (optional)
            prefix: 'windi-', // set compilation mode style prefix
            safeList: ['bg-gray-600', 'text-white'], // (optional)
          }),
        ],
      }),
      // ...
    ],
  },

  server: {
    // ...
    plugins: [
      // ...
      svelte({
        // ...
        preprocess: [
          require('svelte-windicss-preprocess').preprocess({
            config: 'windi.config.js', // windi config file path (optional)
            compile: true, // false: interpretation mode; true: compilation mode (optional)
            prefix: 'windi-', // set compilation mode style prefix
            safeList: ['bg-gray-600', 'text-white'], // (optional)
          }),
        ],
      }),
      // ...
    ],
  },
};
```

## Resources

- [Documents](https://windicss.org)

- [MIT License](https://github.com/windicss/svelte-windicss-preprocess/blob/main/LICENSE)
