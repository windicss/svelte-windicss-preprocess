<script context="module">
	export function preload() {
		return this.fetch(`blog.json`).then(r => r.json()).then(posts => {
			return { posts };
		});
	}
</script>

<script>
	export let posts;
</script>

<svelte:head>
	<title>Blog</title>
</svelte:head>

<h1 class="font-bold text-3xl pb-8">Recent posts</h1>

<ul class="space-y-4">
	{#each posts as post}
		<!-- we're using the non-standard `rel=prefetch` attribute to
				tell Sapper to load the data for the page as soon as
				the user hovers over the link or taps it, instead of
				waiting for the 'click' event -->
		<li class="text-md hover:underline"><a rel="prefetch" href="blog/{post.slug}">{post.title}</a></li>
	{/each}
</ul>
