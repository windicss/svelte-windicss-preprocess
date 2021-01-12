# svelte-windicss-preprocess

> A svelte preprocessor to compile [tailwindcss](https://github.com/tailwindlabs/tailwindcss) at build time based on [windicss](https://github.com/voorjaar/windicss) compiler.

## Installation

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
            preprocess: {
                // svelte-windicss-preprocess
                markup: require('svelte-windicss-preprocess').preprocess({
                    compile: true,          // false: interpretation mode; true: compilation mode
                    globalPreflight: true,  // set preflight style is global or scoped
                    globalUtility: true,    // set utility style is global or scoped
                    prefix: 'windi-'        // set compilation mode style prefix
                })
            },
            // ...
        }),
    ]
    // ...
}
```

### Sveltekit

Add `svelte-windicss-preprocess` to your `svelte.config.js`.

```js
// svelte.config.js
module.exports = {
    preprocess: {
		markup: require('svelte-windicss-preprocess').preprocess({
			compile: false,
			globalPreflight: true,
			globalUtility: true, 
			prefix: 'windi-',
		}),
		// The following code is to ensure that the svelte vscode plugin will not consider tailwind directives to be a syntax error, and will not run during development or compilation.
		// And you should also add "svelte.plugin.css.diagnostics.enable": false to your vscode configuration.
		// For more details, see https://github.com/voorjaar/svelte-windicss-preprocess/blob/main/docs/using-tailwind-directives.md
		style: ({content, }) => {
			return new Promise((resolve, _) => {
			  resolve({ code: content.replace(/@apply[\s\S]+?;/g, '') });
			})
		}
	},
	adapter:  '@sveltejs/adapter-node'
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
                preprocess: {
                    // svelte-windicss-preprocess
                    markup: require('../../src/index').preprocess({
                        compile: true,          // false: interpretation mode; true: compilation mode
                        globalPreflight: true,  // set preflight style is global or scoped
                        globalUtility: true,    // set utility style is global or scoped
                        prefix: 'windi-'        // set compilation mode style prefix
                    }),
                },
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
                preprocess: {
                    // svelte-windicss-preprocess
                    markup: require('../../src/index').preprocess({
                        compile: true,          // false: interpretation mode; true: compilation mode
                        globalPreflight: true,  // set preflight style is global or scoped
                        globalUtility: true,    // set utility style is global or scoped
                        prefix: 'windi-'        // set compilation mode style prefix
                    }),
                },
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
                            preprocess: {
                                // svelte-windicss-preprocess
                                markup: require('../../src/index').preprocess({
                                    compile: true,          // false: interpretation mode; true: compilation mode
                                    globalPreflight: true,  // set preflight style is global or scoped
                                    globalUtility: true,    // set utility style is global or scoped
                                    prefix: 'windi-'        // set compilation mode style prefix
                                })
                            }
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
                            preprocess: {
                                // svelte-windicss-preprocess
                                markup: require('../../src/index').preprocess({
                                    compile: true,          // false: interpretation mode; true: compilation mode
                                    globalPreflight: true,  // set preflight style is global or scoped
                                    globalUtility: true,    // set utility style is global or scoped
                                    prefix: 'windi-'        // set compilation mode style prefix
                                })
                            }
                        }
                    }
                },
                // ...
            ]
        },
    }
}
```

## Usage

You can write any [tailwindcss](https://github.com/tailwindlabs/tailwindcss) classes in your `.svelte` files.

```html
<script>
// ...
</script>

<div class="py-8 px-8 max-w-sm mx-auto bg-white rounded-xl shadow-md space-y-2 sm:py-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-6">
  <img class="block mx-auto h-24 rounded-full sm:mx-0 sm:flex-shrink-0" src="/img/erin-lindford.jpg" alt="Woman's Face">
  <div class="text-center space-y-2 sm:text-left">
    <div class="space-y-0.5">
      <p class="text-lg text-black font-semibold">Erin Lindford</p>
      <p class="text-gray-500 font-medium">Product Engineer</p>
    </div>
    <button class="px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2">Message</button>
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
  <img class="windi-1q7lotv" src="/img/erin-lindford.jpg" alt="Woman's Face">
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

## Features

* `tw` is an optional replacement attribute of `class`, The className in `tw` will be merged into the `class` attribute after compilation.

* Group: You can also write groups in all the attributes mentioned above, such as `class="font-meidum sm:hover:(font-bold bg-gray-200)"`. This is a native feature supported by [windicss](https://github.com/voorjaar/windicss).

* Unrestricted build: such as `bg-hex-1c1c1e p-3.2 p-3rem p-4px w-10/11 bg-$custom-variable ...`

* [Using tailwind directives](https://github.com/voorjaar/svelte-windicss-preprocess/blob/main/docs/using-tailwind-directives.md), such as @apply, @screen.

* States attribute: such as `base sm md lg xl xxl focus hover dark sm:hover dark:hover ...` after applid media rules then also will be merged into the `class` attribute. (In development)

* Customize: Customize font or color, etc. (In development)

* For more details, please refer to [windicss](https://github.com/voorjaar/windicss).

## Resources

* [Roadmap](https://github.com/voorjaar/svelte-windicss-preprocess/projects/1)

* [Documents](https://github.com/voorjaar/windicss)

* [Discussions](https://github.com/voorjaar/windicss/discussions)

* [MIT License](https://github.com/voorjaar/svelte-windicss-preprocess/blob/main/LICENSE)
