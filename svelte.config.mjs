import { windi } from './dist/index.js'
export default {
  preprocess: [
    windi({
      silent: false,
      experimental: {
        icons: {
          prefix: 'i-',
          extraProperties: {
            display: 'inline-block',
          },
        },
      },
    }),
  ],
}
