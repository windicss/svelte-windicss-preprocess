<script>
  import Feature from './components/Feature.svelte'
</script>

<main>
  <div class="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12 test">
    <div class="relative py-3 sm:max-w-xl sm:mx-auto">
      <div class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
      <div class="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
        <div class="max-w-md mx-auto">
          <div>
            <img src="img/logo.svg" alt="logo" class="h-7 sm:h-8"/>
          </div>
          <div class="divide-y divide-gray-300">
            <div class="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
              <p>An advanced online playground for Tailwind CSS, including support for things like:</p>
              <ul class="list-disc space-y-2">
                <Feature>
                  Customizing your
                    <code class="text-sm font-bold text-gray-900">tailwind.config.js</code> file
                </Feature>
                <Feature>
                  Extracting classes with
                    <code class="text-sm font-bold text-gray-900">@apply</code>
                </Feature>
                <Feature>
                  Code completion with instant preview
                </Feature>
              </ul>
              <p>Perfect for learning how the framework works, prototyping a new idea, or creating a demo to share online.</p>
            </div>
            <div class="pt-6 text-base leading-6 font-bold sm:text-lg sm:leading-7">
              <p>Want to dig deeper into Tailwind?</p>
              <p>
                <a href="https://tailwindcss.com/docs" class="text-cyan-600 hover:text-cyan-700"> Read the docs &rarr; </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  .test {
    background: white;
  }

  /* :global(main) {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  } */

  /* h1 {
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
  } */
</style>