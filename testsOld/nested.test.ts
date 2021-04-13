import { preprocess } from '../src/index';
import { testConfig } from './utils';
import { format } from 'prettier';

let content = `
<div class="nestedColor">Hello, World!</div>
<style>
.nestedColor {
  @apply text-red-500;
}

@screen sm {
  .nestedColor {
    @apply text-blue-500;
  }
}
</style>
`;
let expectedOutput = `
<div class="nestedColor">Hello, World!</div>

<style>
:global(*), :global(::before), :global(::after) {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: #e5e7eb;
}
:global(*) {
  --tw-ring-inset: var(--tw-empty,/*!*/ /*!*/);
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgba(59, 130, 246, 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
}
:global(:root) {
  -moz-tab-size: 4;
  -o-tab-size: 4;
  tab-size: 4;
}
:global(:-moz-focusring) {
  outline: 1px dotted ButtonText;
}
:global(:-moz-ui-invalid) {
  box-shadow: none;
}
:global(::moz-focus-inner) {
  border-style: none;
  padding: 0;
}
:global(::-webkit-inner-spin-button), :global(::-webkit-outer-spin-button) {
  height: auto;
}
:global(::-webkit-search-decoration) {
  -webkit-appearance: none;
}
:global(::-webkit-file-upload-button) {
  -webkit-appearance: button;
  font: inherit;
}
:global([type='search']) {
  -webkit-appearance: textfield;
  outline-offset: -2px;
}
:global(abbr[title]) {
  -webkit-text-decoration: underline dotted;
  text-decoration: underline dotted;
}
:global(body) {
  margin: 0;
  font-family: inherit;
  line-height: inherit;
}
:global(html) {
  -webkit-text-size-adjust: 100%;
  font-family: ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";
  line-height: 1.5;
}
.nestedColor {
  --tw-text-opacity: 1;
  color: rgba(239, 68, 68, var(--tw-text-opacity));
}
@media (min-width: 640px) {
  .nestedColor {
    --tw-text-opacity: 1;
    color: rgba(59, 130, 246, var(--tw-text-opacity));
  }
}
</style>
`;
test('nested', async () => {
  let result = (await preprocess({ ...testConfig }).markup({ content, filename: 'nested.svelte' })).code;
  expect(
    format(result, {
      parser: 'html',
      printWidth: 9999,
      tabWidth: 2,
      useTabs: false,
      proseWrap: 'never',
    })
  ).toBe(
    format(expectedOutput, {
      parser: 'html',
      printWidth: 9999,
      tabWidth: 2,
      useTabs: false,
      proseWrap: 'never',
    })
  );
});
