<script>
  // i am a script
  import {windi} from 'windicss/helpers'

  let toggle = true
</script>

<main>
  <!-- i am a template -->
  <!-- windi expresion with condition in the template string in template block -->
  <button on:click={() => toggle = !toggle}>Toggle [{toggle}]</button>
  <div class={windi`${toggle ? "bg-blue-500" : "bg-green-500"}`}>my class should be dynamic</div>
</main>

<style>
    /* i am a style */
</style>