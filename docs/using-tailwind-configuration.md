# Using tailwind configuration

## Create configuration file

Basically it is a simple tailwind configuration file, you need to replace tailwindcss with windicss, if you need to call the default colors. All tailwindcss v2.0 utilities should be customizable, except for variants and plugins which are not currently supported. For detailed configuration, please refer to the [tailwindcss documentation](https://tailwindcss.com/docs/configuration).

```js
// tailwind.config.js
const colors = require('windicss/colors')

module.exports = {
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '976px',
      xl: '1440px',
    },
    colors: {
      gray: colors.coolGray,
      blue: colors.lightBlue,
      red: colors.rose,
      pink: colors.fuchsia,
    },
    fontFamily: {
      sans: ['Graphik', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    extend: {
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  }
}
```

## Add your config file to windicss

Add `config` option to your `rollup.config.js`/`svelte.config.js`.

```js
const windicss = require('svelte-windicss-preprocess');
// ...
plugins: [
    svelte({
        preprocess: {
            markup: windicss.preprocess({
                config: 'tailwind.config.js', // things like ./src/tailwind.config.js also works
                compile: false,
                prefix: 'windi-',
                globalPreflight: true,
                globalUtility: true, 
            }),
        },
       // ...
    }),
    // ...
]
```

Now you can test whether your configuration file is working properly, and welcome feedback if you find any problems.