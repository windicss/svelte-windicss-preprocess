import { preprocess } from '../../src/index';
import { testConfig } from '../helpers/utils';

describe('Preflight test suite', () => {
  let resultA: string;
  let resultB: string;
  let resultC: string;
  let content = '<p>Hello World!</p>';
  let contentB = '<div>I am a supertest</div>';
  it('should generate preflights globally', async () => {
    resultA = '';
    resultA = (await preprocess({ ...testConfig }).markup({ content, filename: 'a.svelte' })).code;
    expect(resultA).toMatchSnapshot('globalPreflight');
    resultB = '';
    resultB = (await preprocess({ ...testConfig }).markup({ content, filename: 'b.svelte' })).code;
    resultC = '';
    resultC = (await preprocess({ ...testConfig }).markup({ content, filename: 'a.svelte' })).code;
    expect(resultC).toEqual(resultA);
  });
});
