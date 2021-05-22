import { suite } from 'uvu'
import { fixture, instance, is } from 'uvu/assert'
import Processor from 'windicss'
import { Magician } from '../src/utils'

const initT = suite('INIT')
initT('isMagician', () => {
  instance(new Magician(new Processor(), '', ''), Magician)
})
initT('correct filename', () => {
  is(new Magician(new Processor(), '', 'src/App.svelte').getFilename(), 'src/App.svelte')
})
initT('correct code', () => {
  is(new Magician(new Processor(), '<script></script><h1>Hello, world!</h1>', '').getCode(), '<script></script><h1>Hello, world!</h1>')
})

initT.run()

const formatT = suite('FORMAT')
formatT('single line tag', () => {
  const input = `<div
  class="bg-red-500"
>
  Test
</div>\n`
  const expected = '<div class="bg-red-500">Test</div>\n'
  const output = new Magician(new Processor(), input, 'src/App.svelte').format().getCode()
  fixture(
    output,
    expected
  )
})
formatT('seperate each block', () => {
  const input = `<ul>
  {#each items as item}
    <li>{item}
    </li>
  {/each}
</ul>`

  const expected = `<ul>
  {#each items as item}
    <li>{item}</li>
  {/each}
</ul>\n`

  const output = new Magician(new Processor(), input, 'src/App.svelte').format().getCode()
  fixture(
    output,
    expected
  )
})
formatT.run()
