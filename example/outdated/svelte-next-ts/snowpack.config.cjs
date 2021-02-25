// Consult https://www.snowpack.dev to learn about these options
// module.exports = {
// 	extends: '@sveltejs/snowpack-config',
// 	plugins: [],
// 	mount: {
// 		'src/components': '/_components'
// 	},
// 	alias: {
// 		$components: './src/components'
// 	}
// };

// We are not extending @sveltejs/snowpack-config because there is an issue of loading preprocessors. The developers will fix this, but for now, we just need to overwrite it.

const path = require('path');
const pkg = require(path.join(process.cwd(), 'package.json'));

// Consult https://www.snowpack.dev to learn about these options
module.exports = {
	packageOptions: {
		// always include Svelte in your project
		knownEntrypoints: ['svelte'],
		// ignore `import fs from 'fs'` etc
		external: [...require('module').builtinModules, ...Object.keys(pkg.dependencies || {})]
	},
	plugins: [
		[
			'@snowpack/plugin-svelte',
			{
				configFilePath: "svelte.config.cjs", // to fix issue of loading preprocessors.
				compilerOptions: {
					hydratable: true
				}
			}
		],
		'@snowpack/plugin-typescript',
	],
	devOptions: {
		open: 'none',
		output: 'stream'
	},
	buildOptions: {
		sourcemap: true
	},
	mount: {
		'.svelte/assets': `/${process.env.SVELTE_KIT_APP_DIR}/assets`,
		'src/components': '/_components'
	},
	alias: {
		$app: './.svelte/assets/runtime/app',
		$components: './src/components'
	}
};
