import { preprocess } from '../../src/index';

describe("comment style test", () => {
  let result: string;
  beforeEach(async function () {
    const content = `<!-- <style lang="postcss">
    nav {
      border: 10px solid black;
      @apply bg-red-200;
    }
  </style> -->`;
    result = (await preprocess().markup({ content, filename: 'test.svelte' })).code;
  });
  it("should not generate styles", () => {
    expect(result).toMatchSnapshot('styles');
  })
});