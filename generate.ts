import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { preprocess } from 'svelte/compiler'

async function main(subPath: string) {
  const path = join(process.cwd(), subPath)
  console.log(path)

  const input = readFileSync(path, 'utf-8')
  // eslint-disable-next-line
  const { code } = await preprocess(
    input,
    require('./src/index').windi({
      silent: true,
    }),
    {
      filename: 'generate.svelte',
    }
  )
  writeFileSync(path.replace('input', 'expected'), code, 'UTF-8')
  console.log('done')
}
main(process.argv[2])
