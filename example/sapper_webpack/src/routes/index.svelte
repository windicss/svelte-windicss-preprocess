<script>
	import successkid from 'images/successkid.jpg';
</script>

<svelte:head>
	<title>Sapper project template</title>
</svelte:head>

<div class="text-gray-600">
	<div class="flex flex-col px-5 py-24 justify-center items-center">
	  <img class="lg:w-2/6 md:w-3/6 w-5/6 mb-10 object-cover object-center rounded-lg" alt="hero" src={successkid}>
	  <div class="w-full md:w-2/3 flex flex-col mb-16 items-center text-center">
		<h1 class="title-font sm:text-4xl text-3xl mb-4 font-medium text-gray-900">Have fun with Sapper!</h1>
		<p class="mb-8 leading-relaxed">Try editing this file (src/routes/index.svelte) to test live reloading.</p>
	  </div>
	</div>
</div>