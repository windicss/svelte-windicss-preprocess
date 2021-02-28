import { preprocess } from '../../src/index';
import { testConfig } from '../helpers/utils';

describe('Scopes test suite', () => {
  let result: string;
  let content = `
<div class="scoped bg-red-200">Hello, World!</div>
<style lang="postcss" scoped>
.scoped {
  @apply text-red-500;
}

@screen sm {
  .scoped {
    @apply text-blue-500;
  }
}
</style>
  `;

  it('should generate scoped classes locally', async () => {
    result = '';
    result = (
      await preprocess({ ...testConfig, compile: false }).markup({
        content,
        filename: 'test.svelte',
      })
    ).code;
    expect(result).toMatchSnapshot('localScopedClasses');
  });

  it('should generate scoped classes locally and compile', async () => {
    result = '';
    result = (
      await preprocess({ ...testConfig, compile: true }).markup({
        content,
        filename: 'test.svelte',
      })
    ).code;
    expect(result).toMatchSnapshot('localScopedClassesCompiled');
  });
});
