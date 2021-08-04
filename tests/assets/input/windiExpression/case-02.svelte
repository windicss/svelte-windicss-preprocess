<script>
// i am a script
// multiple windi expresion in the same line in script block

import { windi } from 'windicss/helpers'

let toggle = true
$: dynamicClass = toggle ? windi`bg-blue-500` : windi`bg-green-500`
</script>

<main>
  <button on:click={() => (toggle = !toggle)}>Toggle [{toggle}]</button>
  <div class={dynamicClass}>my class should be dynamic</div>
</main>

<style>
</style>
