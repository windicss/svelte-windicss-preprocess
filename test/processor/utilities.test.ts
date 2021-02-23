import { preprocess } from '../../src/index';
import { testConfig } from '../helpers/utils';

describe("Utilities test suite", () => {
  let result: string;
  let content = '<div class="bg-red-200">Hello World!</div>';
  it("should generate utility classes globally", async () => {
    result = ""
    result = (await preprocess({ ...testConfig, globalUtility: true }).markup({ content, filename: "test.svelte" })).code;
    expect(result).toMatchSnapshot('globalUtilityClasses')
  })

  it("should generate utility classes locally", async () => {
    result = ""
    result = (await preprocess({ ...testConfig, globalUtility: false }).markup({ content, filename: "test.svelte" })).code;
    expect(result).toMatchSnapshot('lokalUtilityClasses')
  })

})