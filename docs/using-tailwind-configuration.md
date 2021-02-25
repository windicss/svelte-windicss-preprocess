# Using tailwind configuration

## Create configuration file

Basically it is a simple tailwind configuration file, you need to replace tailwindcss with windicss, if you need to call the default colors. All tailwindcss v2.0 utilities should be customizable, except for variants and plugins which are not currently supported. For detailed configuration, please refer to the [tailwindcss documentation](https://tailwindcss.com/docs/configuration).

```js
// tailwind.config.js
const colors = require('windicss/colors');

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
        128: '32rem',
        144: '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
};
```

## Add plugins

Windi CSS provides official plugins which you can add in your configuration file.

They are similar to the ones from Tailwind CSS, but adapted to the interface of Windi CSS to add improvements like auto-inferred utilities.

### Compatibility Chart

| Directive                                                                | Status                                                                             |
| :----------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| [typography](https://github.com/tailwindlabs/tailwindcss-typography)     | ✅ &ensp;[Supported](https://windicss.netlify.app/guide/plugins.html#typography)   |
| [forms](https://github.com/tailwindlabs/tailwindcss-forms)               | ✅ &ensp;[Supported](https://windicss.netlify.app/guide/plugins.html#forms)        |
| [aspect-ratio](https://github.com/tailwindlabs/tailwindcss-aspect-ratio) | ✅ &ensp;[Supported](https://windicss.netlify.app/guide/plugins.html#aspect-ratio) |
| [line-clamp](https://github.com/tailwindlabs/tailwindcss-line-clamp)     | ✅ &ensp;[Supported](https://windicss.netlify.app/guide/plugins.html#line-clamp)   |
| filters                                                                  | ✅ &ensp;[Supported](https://windicss.netlify.app/guide/plugins.html#filters)      |
| scroll-snap                                                              | ✅ &ensp;[Supported](https://windicss.netlify.app/guide/plugins.html#scroll-snap)  |

### Configuration file

```js
// tailwind.config.js
module.exports = {
  theme: {
    // ...
  },
  plugins: [
    require('windicss/plugin/typography'),
    require('windicss/plugin/forms'),
    require('windicss/plugin/aspect-ratio'),
    require('windicss/plugin/line-clamp'),
    require('windicss/plugin/filters'),
    require('windicss/plugin/scroll-snap'),
    // ...
  ],
};
```
