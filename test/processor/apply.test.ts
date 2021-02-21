import { preprocess } from '../../src/index';

describe("apply style test", () => {
  let result: string;
  beforeEach(async function () {
    const content = `<style>
    .testApply {
      @apply pt-6 text-base leading-6 font-bold sm:text-lg sm:leading-7;
      background: red;
    }
    </style><div></div>`;
    result = (await preprocess().markup({ content, filename: 'test.svelte' })).code;
  });
  it("should generate apply styles", () => {
    expect(result).toMatchSnapshot('apply');
  })
});