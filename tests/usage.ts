import { readdir, readdirSync, readFileSync, writeFileSync } from 'fs'
import { preprocess } from 'svelte/compiler'
import { suite } from 'uvu'
import { fixture } from 'uvu/assert'

readdirSync('tests/assets/input', { withFileTypes: true }).forEach(dirent => {
  if (dirent.isDirectory()) {
    const test = suite(dirent.name)
    readdirSync('tests/assets/input/' + dirent.name, { withFileTypes: true }).forEach(file => {
      if (file.isFile()) {
        test(dirent.name + '_' + file.name, async () => {
          const input = readFileSync('tests/assets/input/' + dirent.name + '/' + file.name, 'utf-8')
          const expected = readFileSync('tests/assets/expected/' + dirent.name + '/' + file.name, 'utf-8')
          const { windi } = await import('../src/index')
          const { code } = await preprocess(
            input,
            windi({
              silent: true,
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
              filename: file.name,
            }
          )
          fixture(code, expected)
        })
      }
    })
    test.run()
  }
})
