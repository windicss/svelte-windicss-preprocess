# svelte-windicss-preprocess

> A svelte preprocessor to compile [tailwindcss](https://github.com/tailwindlabs/tailwindcss) at build time based on [windicss](https://github.com/voorjaar/windicss) compiler.

## Installation

> Now we have a great playground, you can [try it online](https://voorjaar.github.io/svelte-windicss-preprocess/) before installing it.

```sh
npm install svelte-windicss-preprocess --save-dev
```

## Configuration

### Svelte

Add `svelte-windicss-preprocess` to your `rollup.config.js`.

```js
// rollup.config.js
// ...
export default {
  // ...
  plugins: [
    svelte({
      // svelte-windicss-preprocess
      preprocess: require('svelte-windicss-preprocess').preprocess({
        config: 'tailwind.config.js', // tailwind config file path (optional)
        compile: true,          // false: interpretation mode; true: compilation mode
        prefix: 'windi-',       // set compilation mode style prefix
        globalPreflight: true,  // set preflight style is global or scoped
        globalUtility: true,    // set utility style is global or scoped
      })
      // ...
    }),
  ]
  // ...
}
```

### Sveltekit

Add `svelte-windicss-preprocess` to your `svelte.config.cjs`.

> For now, sveltekit has an issue of setting the preprocessor. Make sure your `snowpack.config.cjs` is consistent with our [example](https://github.com/voorjaar/svelte-windicss-preprocess/blob/v2.1.0/example/svelte-next/snowpack.config.cjs) before setting.

```js
// svelte.config.cjs
module.exports = {
  preprocess: require("svelte-windicss-preprocess").preprocess({
    // uncomment this, if you need a config file
    // config: 'tailwind.config.js',
    compile: false,
    prefix: "windi-",
    globalPreflight: true,
    globalUtility: true,
  }),
  kit: {
    adapter: "@sveltejs/adapter-node",
    target: "#svelte",
  },
};
```

with Typescript

```js
// svelte.config.cjs
const sveltePreprocess = require('svelte-preprocess');
module.exports = {
  preprocess: [
    sveltePreprocess.typescript(),
    require('svelte-windicss-preprocess').preprocess({
      // uncomment this, if you need a config file
      // config: 'tailwind.config.js',
      compile: false,
      prefix: 'windi-',
      globalPreflight: true,
      globalUtility: true, 
    }),
  ],
  kit: {
    adapter: '@sveltejs/adapter-node',
    target: '#svelte'
  }
};

```

### Sapper(rollup)

Add `svelte-windicss-preprocess` to your `rollup.config.js`.

```js
// rollup.config.js
// ...
export default {
  // ...
  client: {
    input: config.client.input(),
    output: config.client.output(),
    plugins: [
      // ...
      svelte({
        // svelte-windicss-preprocess
        preprocess: require('svelte-windicss-preprocess').preprocess({
          config: 'tailwind.config.js',     // tailwind config file path
          compile: true,                    // false: interpretation mode; true: compilation mode
          prefix: 'windi-',                 // set compilation mode style prefix
          globalPreflight: true,            // set preflight style is global or scoped
          globalUtility: true,              // set utility style is global or scoped
        }),
        compilerOptions: {
          // ...
        }
      }),
      // ...
    ]
  // ...
  }
  server: {
    input: config.server.input(),
    output: config.server.output(),
    plugins: [
      // ...
      svelte({
        // svelte-windicss-preprocess
        preprocess: require('svelte-windicss-preprocess').preprocess({
          config: 'tailwind.config.js',      // tailwind config file path
          compile: true,                     // false: interpretation mode; true: compilation mode
          prefix: 'windi-',                  // set compilation mode style prefix
          globalPreflight: true,             // set preflight style is global or scoped
          globalUtility: true,               // set utility style is global or scoped
        }),
        compilerOptions: {
          // ...
        },
      }),
      // ...
    ]
  }
  // ...
}
```

### Sapper(webpack)

Add `svelte-windicss-preprocess` to your `webpack.config.js`.

```js
// webpack.config.js
module.exports = {
  client: {
    // ...
    module: {
      rules: [
        {
          test: /\.(svelte|html)$/,
          use: {
            loader: 'svelte-loader',
            options: {
              // ... other options
              // svelte-windicss-preprocess
              preprocess: require('svelte-windicss-preprocess').preprocess({
                config: 'tailwind.config.js',    // tailwind config file path
                compile: true,                   // false: interpretation mode; true: compilation mode
                prefix: 'windi-',                // set compilation mode style prefix
                globalPreflight: true,           // set preflight style is global or scoped
                globalUtility: true,             // set utility style is global or scoped
              })
            }
          }
        },
        // ...
      ]
    },
  },

  server: {
    // ...
    module: {
      rules: [
        {
          test: /\.(svelte|html)$/,
          use: {
            loader: 'svelte-loader',
            options: {
              // ... other options
              // svelte-windicss-preprocess
              preprocess: require('svelte-windicss-preprocess').preprocess({
                config: 'tailwind.config.js',     // tailwind config file path
                compile: true,                    // false: interpretation mode; true: compilation mode
                prefix: 'windi-',                 // set compilation mode style prefix
                globalPreflight: true,            // set preflight style is global or scoped
                globalUtility: true,              // set utility style is global or scoped
              })
            }
          }
        },
        // ...
      ]
    },
  }
}
```

## Basic Usage

You can write any [tailwindcss](https://github.com/tailwindlabs/tailwindcss) classes in your `.svelte` files.

```html
<script>
  // ...
</script>

<div
  class="py-8 px-8 max-w-sm mx-auto bg-white rounded-xl shadow-md space-y-2 sm:py-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-6"
>
  <img
    class="block mx-auto h-24 rounded-full sm:mx-0 sm:flex-shrink-0"
    src="/img/erin-lindford.jpg"
    alt="Woman's Face"
  />
  <div class="text-center space-y-2 sm:text-left">
    <div class="space-y-0.5">
      <p class="text-lg text-black font-semibold">Erin Lindford</p>
      <p class="text-gray-500 font-medium">Product Engineer</p>
    </div>
    <button
      class="px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
    >
      Message
    </button>
  </div>
</div>

<style>
  /* ... */
</style>
```

### Compilation mode

This is not css-in-js, [windicss](https://github.com/voorjaar/windicss) only merges and compiles the tailwind classes of each line into a new class. You can try to compile (`npm run build`) and check the generated css file.

```html
<div class="windi-15wa4me">
  <img class="windi-1q7lotv" src="/img/erin-lindford.jpg" alt="Woman's Face" />
  <div class="windi-7831z4">
    <div class="windi-x3f008">
      <p class="windi-2lluw6">Erin Lindford</p>
      <p class="windi-1caa1b7">Product Engineer</p>
    </div>
    <button class="windi-d2pog2">Message</button>
  </div>
</div>
```

```css
/* ... */
.windi-1q7lotv {
  border-radius: 9999px;
  display: block;
  height: 6rem;
  margin-left: auto;
  margin-right: auto;
}
/* ... */
@media (min-width: 640px) {
  /* ... */
  .windi-1q7lotv {
    flex-shrink: 0;
    margin-left: 0;
    margin-right: 0;
  }
/* ... */
```

### Interpretation mode

Interpretation mode will not modify your classes, it will only compile the original tailwind classes just like [tailwindcss](https://github.com/tailwindlabs/tailwindcss), but it is minimized and has native cross-browser support.

```css
/* ... */
.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}
/* ... */
@media (min-width: 640px) {
  /* ... */
  .sm\:items-center {
    align-items: center;
  }
  .sm\:mx-0 {
    margin-left: 0;
    margin-right: 0;
  }
  .sm\:py-4 {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
  /* ... */
}
```

## Using tailwind directives

```css
<style>
  .testApply {
    @apply pt-6 text-base leading-6 font-bold sm:text-lg sm:leading-7;
  }

  @screen sm {
    ul {
      @apply bg-gray-100 p-2 rounded-lg;
    }
  }
</style>
```

### Setup VSCode Extension

If you are using `Svelte for VS Code` vscode extension, I believe most people are using it. You will need to add `"vetur.validation.style": false` to your configuration file.

Hit `ctrl-shift-p` or `cmd-shift-p` on mac, type open settings, and select `Preferences: Open Settings (JSON)`. Add `"vetur.validation.style": false` to `settings.json` then save it.

Then you will need to tell svelte-vscode to **restart the svelte language server** in order to pick up a new configuration.

Hit `ctrl-shift-p` or `cmd-shift-p` on mac, type svelte restart, and select `Svelte: Restart Language Server`. Any errors you were seeing should now go away and you're now all set up!

## Features

- `tw` is an optional replacement attribute of `class`, The className in `tw` will be merged into the `class` attribute after compilation.

- Group: You can also write groups in all the attributes mentioned above, such as `class="font-meidum sm:hover:(font-bold bg-gray-200)"`. This is a native feature supported by [windicss](https://github.com/voorjaar/windicss).

- Unrestricted build: such as `bg-hex-1c1c1e p-3.2 p-3rem p-4px w-10/11 bg-$custom-variable ...`

- [Using tailwind directives], such as `@apply`, `@screen`, `@variants`.

- States attribute: such as `sm md lg xl xxl focus hover dark ...` after applid media rules then also will be merged into the `class` attribute. (Attributes like `sm:hover` are not available because they may be rarely used and slow down the parsing speed.)

- [Customize](https://github.com/voorjaar/svelte-windicss-preprocess/blob/main/docs/using-tailwind-configuration.md): support `tailwind.config.js`.

- For more details, please refer to [windicss](https://github.com/voorjaar/windicss).

## Resources

- [Roadmap](https://github.com/voorjaar/svelte-windicss-preprocess/projects/1)

- [Documents](https://github.com/voorjaar/windicss/wiki/Introduction#what-is-windicss)

- [Discussions](https://github.com/voorjaar/windicss/discussions)

- [MIT License](https://github.com/voorjaar/svelte-windicss-preprocess/blob/main/LICENSE)
