<script>
// i am a script
// windi expresion with condition in the template string in script block

import { windi } from 'windicss/helpers'

let toggle = true
$: dynamicClass = windi`${toggle ? 'bg-blue-500' : 'bg-green-500'}`
</script>

<main>
  <button on:click={() => (toggle = !toggle)}>Toggle [{toggle}]</button>
  <div class={dynamicClass}>my class should be dynamic</div>
</main>

<style windi:inject>
.bg-blue-500 {
  --tw-bg-opacity: 1;
  background-color: rgba(59, 130, 246, var(--tw-bg-opacity));
}
.bg-green-500 {
  --tw-bg-opacity: 1;
  background-color: rgba(16, 185, 129, var(--tw-bg-opacity));
}
</style>
