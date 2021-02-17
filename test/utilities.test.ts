import { readFileSync } from 'fs';
import { preprocess } from '../src/index';

describe("comment style test", () => {
  let result: string;
  beforeEach(async function() {
    const content = `<div class="min-h-screen bg-gray-100 py-6 justify-center aspect-w-9 aspect-h-16" tw="flex flex-col" sm="py-12"></div>`;
    result = await (await preprocess().markup({ content, filename: 'test.svelte'})).code;
  });
  it ("should generate utilities", () => {
    expect(result).toEqual(
String.raw`<div   class="min-h-screen bg-gray-100 py-6 justify-center aspect-w-9 aspect-h-16 flex flex-col sm:py-12"></div>

<style>
${readFileSync('./test/assets/preflight.css').toString()}
:global(.min-h-screen) {
  min-height: 100vh;
}
:global(.bg-gray-100) {
  --tw-bg-opacity: 1;
  background-color: rgba(243, 244, 246, var(--tw-bg-opacity));
}
:global(.py-6) {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}
:global(.justify-center) {
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
}
:global(.flex) {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
}
:global(.flex-col) {
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  -webkit-flex-direction: column;
  flex-direction: column;
}
@media (min-width: 640px) {
  :global(.sm\:py-12) {
    padding-top: 3rem;
    padding-bottom: 3rem;
  }
}
</style>`);
  });
});