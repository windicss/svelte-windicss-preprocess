<script>
  import Widget from './components/Widget.svelte';
</script>

<svelte:head>
  <title>Svelte + Sveasy + Windicss</title>
</svelte:head>

<div class="flex flex-col items-center justify-center bg-indigo-900 min-w-100vw min-h-100vh">
  <Widget />
</div>

<style global>
  .test {
    @apply bg-red-100;
  }
</style>
