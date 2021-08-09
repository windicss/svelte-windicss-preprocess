<script>
</script>

<label for="demo">
  <p>Test</p>
</label>

<style>
  label > :global(*) {
    pointer-events: none;
    @apply bg-red-500;
  }
  :global(*) {
    pointer-events: none;
    @apply bg-green-500;
  }
  test {
    pointer-events:none;
    @apply bg-yellow-500;
  }
  :global(div) > div {
	  color: red;
  }
</style>