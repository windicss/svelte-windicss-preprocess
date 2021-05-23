<div class="custom">hello world</div>

<style>
  .custom {
    background: green;
  }
  :global(.me) {
    background: yellow;
  }
  a {
    @apply text-black hover:text-emerald-400;
  }
  :global(div) {
    @apply bg-light-800 dark:bg-dark-600;
  }
</style>
