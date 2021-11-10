import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { preprocess } from 'svelte/compiler'
import { windi } from './src/index'

async function main(subPath: string) {
  const path = join(process.cwd(), subPath)
  console.log(path)

  const input = readFileSync(path, {
    encoding: 'utf-8',
  })
  const { code } = await preprocess(
    input,
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
    {
      filename: 'generate.svelte',
    }
  )
  writeFileSync(path.replace('input', 'expected'), code, {
    encoding: 'utf-8',
  })
  console.log('done')
}
main(process.argv[2])
