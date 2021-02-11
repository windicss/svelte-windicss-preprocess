<script>
  import Repl from './components/Repl/Repl.svelte';
  import { onMount } from 'svelte';
  let repl;

  const code_1 = 
`<script>
  import Card from './Card.svelte';
  const title = "Finding customers for your new business";
  const content = "Getting a new business off the ground is a lot of hard work. Here are five ideas you can use to find your first customers.";
<\/script>

<div class="container h-screen flex flex-col justify-center">
  <Card {title} {content}/>
</div>
  `;
  const code_2 = 
`<script>
  export let title;
  export let content; 
<\/script>
  
<div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
  <div class="md:flex">
    <div class="md:flex-shrink-0">
      <img class="h-48 w-full object-cover md:w-48" src="https://images.unsplash.com/photo-1515711660811-48832a4c6f69?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=448&q=80" alt="Man looking at item at a store">
    </div>
    <div class="p-8">
      <div class="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Case study</div>
      <a href="/" class="block mt-1 text-lg leading-tight font-medium text-black hover:underline">{title}</a>
      <p class="mt-2 text-gray-500">{content}</p>
    </div>
  </div>
</div>
`;

  onMount(() => {
    repl.set({
      components: [
        {
          type: 'svelte',
          name: 'App',
          source: code_1,
        },
        {
          type: 'svelte',
          name: 'Card',
          source: code_2,
        },
      ],
    });
  });
</script>

<style>

</style>

<Repl bind:this={repl} workersUrl="workers" />
