<script>
  import Widget from './components/Widget.svelte';
  // let comment = false;
</script>

<svelte:head>
  <title>Svelte + Sveasy + Windicss</title>
</svelte:head>

<div class="flex flex-col bg-indigo-900 min-w-100vw min-h-100vh p-5 test items-center justify-center">
  <Widget />
</div>

<style>
  .test {
    @apply bg-red-100;
  }
</style>
