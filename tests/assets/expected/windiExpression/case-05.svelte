<script>
// i am a script
// multiple windi expresion seperated into multiple lines in script block
import { windi } from 'windicss/helpers'

let toggle = true

let dynamicClassA = windi`bg-yellow-500`

let dynamicClassB = windi`bg-red-500`

$: dynamicClass = toggle ? dynamicClassA : dynamicClassB
</script>

<main>
  <button on:click={() => (toggle = !toggle)}>Toggle [{toggle}]</button>
  <div class={dynamicClass}>my class should be dynamic</div>
</main>

<style windi:inject>
.bg-yellow-500 {
  --tw-bg-opacity: 1;
  background-color: rgba(245, 158, 11, var(--tw-bg-opacity));
}
.bg-red-500 {
  --tw-bg-opacity: 1;
  background-color: rgba(239, 68, 68, var(--tw-bg-opacity));
}
</style>
