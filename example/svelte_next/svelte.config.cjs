module.exports = {
	preprocess: {
		markup: require('../../src/index.js').preprocess({
			// config: 'tailwind.config.js',
			compile: false,
			prefix: 'windi-',
			globalPreflight: true,
			globalUtility: true, 
		}),
		// The following code is to ensure that the svelte vscode plugin will not consider tailwind directives to be a syntax error, and will not run during development or compilation.
		// And you should also add "svelte.plugin.css.diagnostics.enable": false to your vscode configuration.
		// For more details, see https://github.com/voorjaar/svelte-windicss-preprocess/blob/main/docs/using-tailwind-directives.md
		style: ({content, }) => {
				return new Promise((resolve, _) => {
					resolve({ code: content.replace(/@apply[\s\S]+?;/g, '') });
				})
		}
	},
	kit: {
		// By default, `npm run build` will create a standard Node app.
		// You can create optimized builds for different platforms by
		// specifying a different adapter
		adapter: '@sveltejs/adapter-node',

		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte'
	}
};
