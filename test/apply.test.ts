import { readFileSync } from 'fs';
import { preprocess } from '../src/index';

describe("apply style test", () => {
  let result: string;
  beforeEach(async function() {
    const content = `<style>
    .testApply {
      @apply pt-6 text-base leading-6 font-bold sm:text-lg sm:leading-7;
      background: red;
    }
    </style><div></div>`;
    result = await (await preprocess().markup({ content, filename: 'test.svelte'})).code;
  });
  it ("should generate apply styles", () => {
    console.log(result);
    expect(result).toEqual(
String.raw`<div></div>

<style>
${readFileSync('./test/assets/preflight.css')}
.testApply {
  background: red;
  padding-top: 1.5rem;
  font-size: 1rem;
  line-height: 1.5rem;
  font-weight: 700;
}
@media (min-width: 640px) {
  .testApply {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }
}
</style>`);
  })
});