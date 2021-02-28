import { preprocess } from '../../src/index';
import { testConfig } from '../helpers/utils';

describe('Templates test suite', () => {
  let result: string;
  let content = '<div class={`px-1.5 ${myClass ? "bg-red-100" : "bg-teal-500"} `}>Hello World!</div>';
  it('schould parse template syntax globally', async () => {
    result = '';
    result = (await preprocess({ ...testConfig, compile: false }).markup({ content, filename: 'test.svelte' })).code;
    expect(result).toMatchSnapshot('globalTemplateClasses');
  });
});
