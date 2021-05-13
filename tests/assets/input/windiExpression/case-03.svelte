<script>
  // i am a script
  // windi expresion with condition in the template string in script block

  import {windi} from 'windicss/helpers'
  
  let toggle = true
  $: dynamicClass = windi`${toggle ? "bg-blue-500" : "bg-green-500"}`
</script>

<main>
  <!-- i am a template -->
  <button on:click={() => toggle = !toggle}>Toggle [{toggle}]</button>
  <div class={dynamicClass}>my class should be dynamic</div>
</main>

<style>
    /* i am a style */
</style>