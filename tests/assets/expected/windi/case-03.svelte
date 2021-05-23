<div class="custom">hello world</div>

<style windi:inject>
:global(.me) {
  background: yellow;
}
:global(div) {
  --tw-bg-opacity: 1;
  background-color: rgba(222, 226, 230, var(--tw-bg-opacity));
}
:global(.dark div) {
  --tw-bg-opacity: 1;
  background-color: rgba(28, 28, 30, var(--tw-bg-opacity));
}
.custom {
  background: green;
}
a {
  --tw-text-opacity: 1;
  color: rgba(0, 0, 0, var(--tw-text-opacity));
}
a:hover {
  --tw-text-opacity: 1;
  color: rgba(52, 211, 153, var(--tw-text-opacity));
}
</style>
