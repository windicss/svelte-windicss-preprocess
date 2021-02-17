import { readFileSync } from 'fs';
import { preprocess } from '../src/index';

describe("comment style test", () => {
  let result: string;
  beforeEach(async function() {
    const content = `<p>Hello World</p>`;
    result = await (await preprocess().markup({ content, filename: 'test.svelte'})).code;
  });
  it ("should generate preflights", () => {
    expect(result).toEqual(
`<p>Hello World</p>

<style>
${readFileSync('./test/assets/preflight.css').toString()}
:global(p) {
  margin: 0;
}
</style>`);
  })
});