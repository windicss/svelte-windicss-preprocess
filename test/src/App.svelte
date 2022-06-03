<script>
    import Button from "./Button.svelte"
</script>


<div class="bg-gray-50">
    Hello, world
</div>

<style>
:root {
    --primary-50: rgb(255, 251, 250);
    --primary-100: rgb(254, 244, 241);
    --primary-200: rgb(250, 201, 183);
    --primary-300: rgb(246, 158, 126);
    --primary-400: rgb(242, 115, 69);
    --primary-500: rgb(232, 73, 16);
    --primary-600: rgb(186, 59, 13);
    --primary-700: rgb(138, 44, 10);
    --primary-800: rgb(95, 30, 7);
    --primary-900: rgb(48, 15, 3);

    /* https://github.com/adamwathan/tailwind-css-variable-text-opacity-demo */
    --primary-dynamic: 232, 73, 16;

    --primary-gradient-from: 220, 38, 38;
    --primary-gradient-to: 234, 88, 12;
}
:global(.button) {
    background: green;
}
</style>
