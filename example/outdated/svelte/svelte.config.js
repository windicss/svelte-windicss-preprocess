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