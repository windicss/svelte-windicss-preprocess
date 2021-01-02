<script>
	import Nav from '../components/Nav.svelte';

	export let segment;
</script>

<Nav {segment}/>

<main class="pt-24 px-12 container mx-auto">
	<slot></slot>
</main>