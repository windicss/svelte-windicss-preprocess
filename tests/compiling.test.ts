import { preprocess } from '../src/index';
import { testConfig } from './utils';
import { html } from 'js-beautify';

let content = `
<div class="bg-red-200 text-white customClass">Hello, World!</div>
<style >
.customClass {
  @apply text-red-500;
}
</style>
`;
let expectedOutputCompiled = `
<div class="windi-xewwwb customClass">Hello, World!</div>
<style>
:global(*),
:global(::before),
:global(::after) {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: #e5e7eb;
}

:global(*) {
  --tw-ring-inset: var(--tw-empty, /*!*/ /*!*/);
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

:global(::-webkit-inner-spin-button),
:global(::-webkit-outer-spin-button) {
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
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  line-height: 1.5;
}

.customClass {
  --tw-text-opacity: 1;
  color: rgba(239, 68, 68, var(--tw-text-opacity));
}

.windi-xewwwb {
  --tw-bg-opacity: 1;
  background-color: rgba(254, 202, 202, var(--tw-bg-opacity));
  --tw-text-opacity: 1;
  color: rgba(255, 255, 255, var(--tw-text-opacity));
}
</style>
`;
let expectedOutputUncompiled = `
<div class="bg-red-200 text-white customClass">Hello, World!</div>
<style>
  :global(*),
  :global(::before),
  :global(::after) {
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    border-width: 0;
    border-style: solid;
    border-color: #e5e7eb;
  }
  :global(*) {
    --tw-ring-inset: var(--tw-empty, /*!*/ /*!*/);
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
  :global(::-webkit-inner-spin-button),
  :global(::-webkit-outer-spin-button) {
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
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    line-height: 1.5;
  }
  .bg-red-200 {
    --tw-bg-opacity: 1;
    background-color: rgba(254, 202, 202, var(--tw-bg-opacity));
  }
  .text-white {
    --tw-text-opacity: 1;
    color: rgba(255, 255, 255, var(--tw-text-opacity));
  }
  .customClass {
    --tw-text-opacity: 1;
    color: rgba(239, 68, 68, var(--tw-text-opacity));
  }
</style>
`;
test('uncompiled', async () => {
  let resultUncompiled = (
    await preprocess({ ...testConfig, compile: false }).markup({ content, filename: 'preflightsTest.svelte' })
  ).code;
  expect(html(resultUncompiled, { preserve_newlines: false })).toBe(
    html(expectedOutputUncompiled, { preserve_newlines: false })
  );
});
test('compiled', async () => {
  let resultCompiled = (
    await preprocess({ ...testConfig, compile: true }).markup({ content, filename: 'preflightsTest.svelte' })
  ).code;
  expect(html(resultCompiled, { preserve_newlines: false })).toBe(
    html(expectedOutputCompiled, { preserve_newlines: false })
  );
});
