import { readFileSync } from "fs";
import { preprocess } from "svelte/compiler";
import { test } from "uvu";
import { fixture } from 'uvu/assert';


test.before.each(() => {
  delete require.cache[require.resolve("../dist/index")]
});

test("base", async () => {
  let input = '<div class="bg-red-500">Hello World!</div>'

  let expected = readFileSync("tests/assets/one.txt", "utf-8")

  const { code } = await preprocess(input, require("../dist/index").preprocess({
    silent: true,
    debug: true
  }), {
    filename: 'base.svelte'
  });
  let actual = code
  fixture(actual, expected)
})

test("template in expression", async () => {
  let input = '<div class={`bg-red-50`}>Hello World!</div>'

  let expected = readFileSync("tests/assets/two.txt", "utf-8")
  const { code } = await preprocess(input, require("../dist/index").preprocess({
    silent: true,
    debug: true
  }), {
    filename: 'base.svelte'
  });
  let actual = code
  fixture(actual, expected)
})

test("windi in expression", async () => {
  let input = '<div class={windi`bg-red-500`}>Hello World!</div>'

  let expected = readFileSync("tests/assets/three.txt", "utf-8")

  const { code } = await preprocess(input, require("../dist/index").preprocess({
    silent: true,
    debug: true
  }), {
    filename: 'base.svelte'
  });

  let actual = code
  fixture(actual, expected)
})

test("wind in expression, with dynamic class", async () => {
  let input = '<div class={windi`bg-red-${shade}`}>Hello World!</div>'

  let expected = readFileSync("tests/assets/four.txt", "utf-8")

  const { code } = await preprocess(input, require("../dist/index").preprocess({
    silent: true,
    debug: true
  }), {
    filename: 'base.svelte'
  });

  let actual = code
  fixture(actual, expected)
})

test("expression", async () => {
  let input = '<div class={"bg-red-500"}>Hello World!</div>'

  let expected = readFileSync("tests/assets/five.txt", "utf-8")

  const { code } = await preprocess(input, require("../dist/index").preprocess({
    silent: true,
    debug: true
  }), {
    filename: 'base.svelte'
  });

  let actual = code
  fixture(actual, expected)
})

test("windi in expression with inline if", async () => {
  let input = "<div class={windi`${toggle ? 'bg-blue-500' : 'bg-red-500'}`}>Hello World!</div>"

  let expected = readFileSync("tests/assets/six.txt", "utf-8")

  const { code } = await preprocess(input, require("../dist/index").preprocess({
    silent: true,
    debug: true
  }), {
    filename: 'base.svelte'
  });

  let actual = code
  fixture(actual, expected)
})

test("inline expression with inline if and windi", async () => {
  let input = "<div class={toggle ? windi`bg-yellow-500` : windi`bg-red-500`}>Hello World!</div>"

  let expected = readFileSync("tests/assets/seven.txt", "utf-8")

  const { code } = await preprocess(input, require("../dist/index").preprocess({
    silent: true,
    debug: true
  }), {
    filename: 'base.svelte'
  });

  let actual = code
  fixture(actual, expected)
})

test("class directive", async () => {
  let input = "<div class:bg-red-800={toggle} class:bg-blue-800={toggle}>Hello World!</div>"

  let expected = readFileSync("tests/assets/eight.txt", "utf-8")

  const { code } = await preprocess(input, require("../dist/index").preprocess({
    silent: true,
    debug: true
  }), {
    filename: 'base.svelte'
  });

  let actual = code
  fixture(actual, expected)
})

test("inline expression with inline if", async () => {
  let input = "<div class={toggle ? 'text-white bg-blue-500' : 'bg-red-500'}>Hello World!</div>"

  let expected = readFileSync("tests/assets/nine.txt", "utf-8")

  const { code } = await preprocess(input, require("../dist/index").preprocess({
    silent: true,
    debug: true
  }), {
    filename: 'base.svelte'
  });

  let actual = code
  fixture(actual, expected)
})

test("advanced", async () => {
  let input = `<div class="text-gray-100 test {blue ? 'test' : 'bg-red-500'} language-{size} {className}">Hello World!</div>`

  let expected = readFileSync("tests/assets/ten.txt", "utf-8")

  const { code } = await preprocess(input, require("../dist/index").preprocess({
    silent: true,
    debug: true
  }), {
    filename: 'base.svelte'
  });

  let actual = code
  fixture(actual, expected)
})

test.run()