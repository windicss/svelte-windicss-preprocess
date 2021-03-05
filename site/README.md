# svelte-repl

This is a minimal implementation of the Svelte REPL, which preprocesses Windi CSS.

## Usage

Install dependencies:

```sh
npm i
```

Run server for development (with hot reloading):

```sh
npm run dev
```

Build files for production:

```sh
npm run build
```

[//]: # "TODO: regarding the build configuration, it is messy and unorganized: you can't .gitignore the build files and the workers aren't even built! Maybe look into remaking it?"

Serve the production files:

```sh
npm run start
```

You can also use other package managers, such as `yarn` or `pnpm`.
