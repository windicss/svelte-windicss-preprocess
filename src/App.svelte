<script>
  import Heading from './components/Heading.svelte'
  export let name;
</script>

<main>
  <Heading></Heading>
  <h1 class='font-bold text-green-300 md:text-red-500 text-green-300 abc bg-coolGray-300 bg-hex-fff bg-rgb(32,31,22) bg-raw-#fff bg-rgba(255, 0, 0, 0.3) bg-hsl(0, 100%, 25%) bg-hsla(0, 100%, 50%, 0.5)'>Hello {{name}}!</h1>
  <div class='flex flex-col justify-center'>
    <p class='text-gray-300'>this is a test</p>
  </div>
  <div class='flex flex-col justify-center' id='test'>
    <p class='text-gray-300'>this is second test</p>
  </div>
</main>

<style>
  .abc {
    @apply text-left sm(font-bold);
    color: #000;
  }

  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }

  @media (prefers-color-scheme: dark) {
    h1 {
      color: green;
    }
  }

  @media (prefers-color-scheme: dark) {
    h1 {
      text-align: left;
    }
  }
</style>