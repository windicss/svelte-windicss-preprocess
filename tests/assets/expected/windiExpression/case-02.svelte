<script>
// i am a script
// multiple windi expresion in the same line in script block

import { windi } from "windicss/helpers";

let toggle = true;
$: dynamicClass = toggle ? windi`bg-blue-500` : windi`bg-green-500`;
</script>

<main>
  <button on:click="{() => (toggle = !toggle)}">Toggle [{toggle}]</button>
  <div class="{dynamicClass}">my class should be dynamic</div>
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
