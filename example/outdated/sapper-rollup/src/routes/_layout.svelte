<script>
  import Nav from '../components/Nav.svelte';

  export let segment;
</script>

<Nav {segment} />

<main class="container px-12 pt-24 mx-auto ">
  <slot />
</main>

<style>
</style>
