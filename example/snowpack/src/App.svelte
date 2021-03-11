<script>
  import Widget from './components/Widget.svelte';
  let num = 200;
  function updateMe() {
    console.log(num);
    num += 50;
    console.log(num);
  }
  export let active = false;
  let myClass = true;
  let isActive = true;
  function changeActive() {
    isActive = !isActive;
    myClass = !myClass;
  }
</script>

<svelte:head>
  <title>Svelte + Sveasy + Windicss</title>
</svelte:head>

<div
  on:click={updateMe}
  class="bg-gray-800 animate-pulse text-gray-100 test"
  hover="bg-gray-500 text-blue-600 sm:bg-yellow-500 disabled:(bg-gray-300 text-gray-100)"
>
  My background is dynamic
</div>
<div
  on:click={updateMe}
  class="bg-gray-800 text-gray-100 test sm:(bg-amber-500 text-black) hover:(bg-amber-100 text-black) sm:hover:(bg-red-100 text-black)"
>
  My background is dynamic
</div>
<div on:click={changeActive} class={isActive ? 'bg-gray-500' : 'bg-red-100'}>My background is dynamic</div>
<div class={'red'}>Should be red!</div>
<div class={`red`}>Should be red!</div>

<div class:red={myClass}>Should be red!</div>
<div class={myClass}>Should be black!</div>
<!-- Template literal as expression -->
<div class={`${myClass}`}>Should be black!</div>
<!-- Yet another template literal as expression -->
<div class={`${myClass ? 'red' : 'bg-amber-100'}`} hover={`${myClass ? 'red' : 'bg-amber-100'}`}>Should be red!</div>
<div class={myClass ? `${myClass ? 'red' : 'bg-amber-100'}` : 'bg-red-10'}>Should be red!</div>
<!-- Let's spice things up... -->
<div class={['px-1.5', myClass ? 'red' : '', ''].join(' ')}>Should be red!</div>
<Widget />

<!-- Let's spice things up...
<div class={['px-1.5', myClass ? 'red' : '', ''].join(' ')}>Should be red!</div>
-->
<style>
  .test {
    @apply p-10;
  }
  .red {
    color: red;
  }
</style>
