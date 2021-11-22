<script>
// i am a script
// destructing multiple windi expresion from an array in script block
import { windi } from 'windicss/helpers'

let toggle = true

let [dynamicClassA, dynamicClassB] = [windi`bg-pink-500`, windi`bg-orange-500`]

$: dynamicClass = toggle ? dynamicClassA : dynamicClassB
</script>

<main>
  <button on:click={() => (toggle = !toggle)}>Toggle [{toggle}]</button>
  <div class={dynamicClass}>my class should be dynamic</div>
</main>

<style>
.bg-pink-500 {
  --tw-bg-opacity: 1;
  background-color: rgba(236, 72, 153, var(--tw-bg-opacity));
}
.bg-orange-500 {
  --tw-bg-opacity: 1;
  background-color: rgba(249, 115, 22, var(--tw-bg-opacity));
}
</style>
