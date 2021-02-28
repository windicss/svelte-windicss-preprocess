import { preprocess } from '../../src/index';
import { testConfig } from '../helpers/utils';

describe('Comments test suite', () => {
  let result: string;
  let content = `
<!--<div class="bg-red-100">Hello World!</div>-->
<div>Hello World!</div>
<!-- <style>.red {background: red}</style> -->
  `;
  it('should ignore comments', async () => {
    result = '';
    result = (await preprocess({ ...testConfig }).markup({ content, filename: 'test.svelte' })).code;
    expect(result).toMatchSnapshot('globalCommentClasses');
  });
});
