import { preprocess } from '../../src/index';
import { testConfig } from '../helpers/utils';

describe('Preflight test suite', () => {
  let result: string;
  let content = '<p>Hello World!</p>';
  it('should generate preflights globally', async () => {
    result = '';
    result = (await preprocess({ ...testConfig }).markup({ content, filename: 'test.svelte' })).code;
    expect(result).toMatchSnapshot('globalPreflight');
  });
});
