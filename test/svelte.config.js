import { generate } from 'svelte-windicss-preprocess'

export default {
  preprocess: generate({
    attributify: {
    },
    typography:{
      
    } ,
    icons: {
      prefix: 'i-',
      collections: {}
    }
  }),
}
