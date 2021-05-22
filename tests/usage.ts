import { readFileSync } from 'fs'
import { preprocess } from 'svelte/compiler'
import { suite } from 'uvu'
import { fixture } from 'uvu/assert'

const classTest = suite('class attribute')

classTest.before.each(() => {
  delete require.cache[require.resolve('../dist/index')]
})

classTest('class_case-01', async () => {
  const input = readFileSync('tests/assets/input/classAttribute/case-01.svelte', 'utf-8')
  const expected = readFileSync('tests/assets/expected/classAttribute/case-01.svelte', 'utf-8')
  // eslint-disable-next-line
  const { code } = await preprocess(input, require('../dist/index').windi({
    silent: true
  }), {
    filename: 'case-01.svelte'
  })

  fixture(code, expected)
})

classTest('class_case-02', async () => {
  const input = readFileSync('tests/assets/input/classAttribute/case-02.svelte', 'utf-8')
  const expected = readFileSync('tests/assets/expected/classAttribute/case-02.svelte', 'utf-8')
  // eslint-disable-next-line
  const { code } = await preprocess(input, require('../dist/index').windi({
    silent: true
  }), {
    filename: 'case-02.svelte'
  })

  fixture(code, expected)
})

classTest('class_case-03', async () => {
  const input = readFileSync('tests/assets/input/classAttribute/case-03.svelte', 'utf-8')
  const expected = readFileSync('tests/assets/expected/classAttribute/case-03.svelte', 'utf-8')
  // eslint-disable-next-line
  const { code } = await preprocess(input, require('../dist/index').windi({
    silent: true
  }), {
    filename: 'case-03.svelte'
  })

  fixture(code, expected)
})

classTest('class_case-04', async () => {
  const input = readFileSync('tests/assets/input/classAttribute/case-04.svelte', 'utf-8')
  const expected = readFileSync('tests/assets/expected/classAttribute/case-04.svelte', 'utf-8')
  // eslint-disable-next-line
  const { code } = await preprocess(input, require('../dist/index').windi({
    silent: true
  }), {
    filename: 'case-04.svelte'
  })

  fixture(code, expected)
})

classTest('class_case-05', async () => {
  const input = readFileSync('tests/assets/input/classAttribute/case-05.svelte', 'utf-8')
  const expected = readFileSync('tests/assets/expected/classAttribute/case-05.svelte', 'utf-8')
  // eslint-disable-next-line
  const { code } = await preprocess(input, require('../dist/index').windi({
    silent: true
  }), {
    filename: 'case-05.svelte'
  })

  fixture(code, expected)
})

classTest.run()
