import { writeFileSync } from 'fs';
import { preprocess } from '../../src/index';

describe("utilities style test", () => {
  let result: string;
  beforeEach(async function () {
    const content = `<div class="min-h-screen bg-gray-100 py-6 justify-center aspect-w-9 aspect-h-16" tw="flex flex-col" sm="py-12"></div>`;
    result = (await preprocess().markup({ content, filename: 'test.svelte' })).code;
  });
  it("should generate utilities", () => {
    writeFileSync('test.css', result);
    expect(result).toMatchSnapshot('utilities');
  });
});