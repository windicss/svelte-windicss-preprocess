import { preprocess } from '../../src/index';

describe("comment style test", () => {
  let result: string;
  beforeEach(async function() {
    const content = `<p>Hello World</p>`;
    result = await (await preprocess().markup({ content, filename: 'test.svelte' })).code;
  });
  it ("should generate preflights", () => {
    expect(result).toMatchSnapshot('preflight');
  })
});