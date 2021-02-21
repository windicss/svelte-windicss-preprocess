import { writeFileSync } from 'fs';
import { preprocess } from '../../src/index';

describe("templates style test", () => {
  let result: string;
  beforeEach(async function () {
    const content = '<div class={`px-1.5 ${myClass ? "bg-red-100" : "bg-teal-500"}`}>Should be red!</div>';
    result = (await preprocess().markup({ content, filename: 'test.svelte' })).code;
  });
  it("should generate utilities", () => {
    expect(result).toMatchSnapshot('templates');
  });
});