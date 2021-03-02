
import { preprocess } from '../../src/index';

describe('bug test suite', () => {
  
  it('calling preprocess two times with the same content, drops global styles', async () => {
    const filename = 'a.svelte'
    const content = '<h1>test 1</h1>'
    const content2 = '<h1>test </h1>'
    const { markup } = preprocess()

    const result1 = (await markup({ content, filename })).code;    
    const result2 = (await markup({ content: content2, filename })).code;    
    const result3 = (await markup({ content, filename })).code;
    
    expect(result1).toEqual(result3)
  });
});
