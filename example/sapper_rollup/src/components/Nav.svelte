<script>
	export let segment;
</script>


<nav class="fixed top-0 z-10 w-full flex items-center justify-between px-2 bg-white bg-green-300 shadow h-16">
	<div class='px-4'>
		<a class="text-lg font-medium tracking-widest leading-relaxed inline-block mr-4 py-2 whitespace-no-wrap uppercase text-gray-900" href="/">
			windicss
		</a>
	</div>
	<ul class='flex items-center pr-2.5'>
		<li>
			<a class="px-3 py-2 flex items-center text-xs uppercase font-bold leading-snug text-gray-700 hover:bg-blue-gray-100 rounded mx-2" class:bg-blue-gray-100={segment===undefined} href="/">
			  Home
			</a>
		</li>
		<li>
			<a class="px-3 py-2 flex items-center text-xs uppercase font-bold leading-snug text-gray-700 hover:bg-blue-gray-100 rounded mx-2" class:bg-blue-gray-100={segment==='about'} href="/about">
				About
			</a>
		</li>
		<li>
			<a class="px-3 py-2 flex items-center text-xs uppercase font-bold leading-snug text-gray-700 hover:bg-blue-gray-100 rounded mx-2" class:bg-blue-gray-100={segment==='blog'} href="/blog">
				Blog
			</a>
		</li>
	</ul>
</nav>