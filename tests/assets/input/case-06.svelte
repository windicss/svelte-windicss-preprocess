<script>
  // i am a script
  // destructing multiple windi expresion from array in script block
  import {windi} from 'windicss/helpers'

  let toggle = true

  let [dynamicClassA, dynamicClassB]= [windi`bg-pink-500`, windi`bg-orange-500`]

  $: dynamicClass = toggle ? dynamicClassA : dynamicClassB
</script>

<main>
  <!-- i am a template -->
  <button on:click={() => toggle = !toggle}>Toggle [{toggle}]</button>
  <div class={dynamicClass}>my class should be dynamic</div>
</main>

<style>
    /* i am a style */
</style>