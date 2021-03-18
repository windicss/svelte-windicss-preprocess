# svelte-windicss-preprocess

A svelte preprocessor for [windicss](https://github.com/windicss/windicss). Windi CSS is a next generation utility-first CSS framework.

If you are already familiar with [Tailwind CSS](https://tailwindcss.com/docs), think about Windi CSS as an on-demanded alternative to Tailwind, which provides faster load times, fully compatible with Tailwind v2.0 and with a bunch of additional cool features.

---

## Installation

<!-- gets replaced with https://next.windicss.org/play.html if public -->
> Now we have a great playground, you can [try it online](https://windicss.github.io/svelte-windicss-preprocess/) before installing it.

```sh
npm i -D svelte-windicss-preprocess
```

<!-- ### [integrations guides](https://next.windicss.org/guide/integrations/svelte-preprocessor.html) can be found in windicss docs -->

---

## Configuration

```js
// svelte.config.js
module.exports = {
  preprocess: require("svelte-windicss-preprocess-exp").preprocess({
    compile: false,
    prefix: 'windi-',
  }),
};
```

| option | description |
|---|---|
| config | string that represent the location of [windicss configuration](https://windicss.org) |
| safeList | array of classes windicss should include even if not used in markup |
| compile | boolean wether windicss runs in [compilation or interpretion mode](https://windicss.org) |
| prefix | class prefix if preprocessor is running in compilation mode |
| silent | boolean of logging


## Resources

- [Documents](https://windicss.org)

- [MIT License](https://github.com/windicss/svelte-windicss-preprocess/blob/main/LICENSE)
