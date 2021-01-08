# Using tailwind directives

## Setup Svelte

create `svelte.config.js` with the following stub, this ensures that `@apply` will not cause any errors.

```js
// svelte.config.js
module.exports = {
    preprocess: {
      style: ({content, }) => {
        return new Promise((resolve, _) => {
          resolve({ code: content.replace(/@apply[\s\S]+?;/g, '') });
        })
      }
    }
}
```

## Setup VSCode Extension

If you are using `Svelte for VS Code`, I believe most people are using it. You will need to add `"svelte.plugin.css.diagnostics.enable": false` to your configuration file.

Hit `ctrl-shift-p` or `cmd-shift-p` on mac, type open settings, and select `Preferences: Open Settings (JSON)`. Add `"svelte.plugin.css.diagnostics.enable": false` to `settings.json` then save it.

## Restart svelte language server

The last step, you will need to tell svelte-vscode to restart the svelte language server in order to pick up a new configuration.

Hit `ctrl-shift-p` or `cmd-shift-p` on mac, type svelte restart, and select `Svelte: Restart Language Server`. Any errors you were seeing should now go away and you're now all set up!