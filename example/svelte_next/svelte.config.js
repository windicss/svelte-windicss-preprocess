// svelte.config.js
module.exports = {
    preprocess: {
		markup: require('../../src/index').preprocess({
			compile: false,
			globalPreflight: true,
			globalUtility: true, 
			prefix: 'windi-',
		}),
		// The following code is to ensure that the svelte vscode plugin will not consider tailwind directives to be a syntax error, and will not run during development or compilation.
		// And you should also add "svelte.plugin.css.diagnostics.enable": false to your vscode configuration.
		// More details, see https://github.com/voorjaar/svelte-windicss-preprocess/blob/main/docs/using-tailwind-directives.md
		style: ({content, }) => {
			return new Promise((resolve, _) => {
			  resolve({ code: content.replace(/@apply[\s\S]+?;/g, '') });
			})
		}
	},
	adapter:  '@sveltejs/adapter-node'
};