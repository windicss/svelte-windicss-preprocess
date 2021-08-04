<script>
// i am a script
import { windi } from 'windicss/helpers'

let toggle = true
</script>

<main>
  <button on:click={() => (toggle = !toggle)}>Toggle [{toggle}]</button>
  <div class={toggle ? windi`bg-blue-500` : windi`bg-green-500`}>my class should be dynamic</div>
</main>

<style>
</style>
