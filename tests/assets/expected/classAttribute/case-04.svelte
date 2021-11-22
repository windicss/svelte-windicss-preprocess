<script>
let isPrimary = true
</script>

<main>
  <div class={isPrimary ? 'bg-red-500' : 'bg-yellow-500'}>my text is large</div>
</main>

<style>
.bg-red-500 {
  --tw-bg-opacity: 1;
  background-color: rgba(239, 68, 68, var(--tw-bg-opacity));
}
.bg-yellow-500 {
  --tw-bg-opacity: 1;
  background-color: rgba(245, 158, 11, var(--tw-bg-opacity));
}
</style>
