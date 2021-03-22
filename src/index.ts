import { Processor } from 'windicss/lib';
import { generateCompletions } from "windicss/utils";
import { CSSParser } from 'windicss/utils/parser';
import { StyleSheet } from 'windicss/utils/style';
import { loadConfig, writeFileSync, combineStyleList, globalStyleSheet, logging } from './utils';
import type { Options } from './interfaces';

let DEV: boolean = false;
let PROCESSOR: Processor;
let VARIANTS: string[] = [];
let BUNDLEFILE: string;
let IGNORED_CLASSES: string[] = [];
let STYLESHEETS: StyleSheet[] = [];
let CONDITIONS: StyleSheet[] = [];
let SAFELIST: StyleSheet[] = [];
let FILES: (string | undefined)[] = [];
let BUNDLES: { [key: string]: StyleSheet } = {};
let IS_MAIN: boolean = true;

let OPTIONS: Options = {
  compile: false,
  prefix: 'windi-',
  verbosity: 1,
  debug: false,
  devTools: {completions: false}
};

const REGEXP = {
  matchStyle: /<style[^>]*?(\/|(>([\s\S]*?)<\/style))>/,
  matchScript: /<script[^>]*?(\/|(>([\s\S]*?)<\/script))>/,
  matchClasses: /('[\s\S]+?')|("[\s\S]+?")|(`[\s\S]+?`)/g,
};

const MODIFIED: { [key: string]: string } = {
  xxl: '2xl',
  'tw-disabled': 'disabled',
  'tw-required': 'required',
  'tw-checked': 'checked',
};

function _preprocess(content: string, filename: string) {
  // FIXME: needs to be refactored. shouldn't remove comments completly, just for parsing
  // TODO: move to utils
  content = content.replace(/<!--[\s\S]*?-->/g, '');
  // TODO: move to utils
  // transforms groups to multiple classes
  content = content.replace(/([!\w][\w:_/-]*?):\(([\w\s/-]*?)\)/gm, (_, groupOne: string, groupTwo: string) =>
    groupTwo
      .split(/\s/g)
      .map(cssClass => `${groupOne}:${cssClass}`)
      .join(' ')
  );
  let style = content.match(REGEXP.matchStyle)?.[0];
  if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 2) {
    console.log('[DEBUG] matched style tag', style);
  }
  if (style) {
    var global = style.match(/\<style global\>/gi);
    style = style.replace(/<\/?style[^>]*>/g, '');
    if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 2) {
      console.log('[DEBUG] converted style tag', style);
    }
    if (global) {
      STYLESHEETS.push(globalStyleSheet(new CSSParser(style, PROCESSOR).parse()));
    } else {
      STYLESHEETS.push(new CSSParser(style, PROCESSOR).parse());
    }
    content = content.replace(REGEXP.matchStyle, '');
  }

  let convertedContent = content;
  let checkedHtml;
  if (!process.env.BROWSER) {
    const prettier = require('prettier');
    convertedContent = convertedContent.replace(/(?<=[\<]{1}\w[^\>]+)\n/gmi, " ")
    if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 5) {
      console.log('[DEBUG] raw input', convertedContent);
    }
    checkedHtml = prettier.format(convertedContent, {
      parser: 'svelte',
      pluginSearchDirs: ['.'],
      plugins: ['prettier-plugin-svelte'],
      printWidth: 9999,
      tabWidth: 2,
      svelteSortOrder: 'options-styles-scripts-markup',
      svelteStrictMode: true,
      svelteBracketNewLine: false,
      svelteAllowShorthand: false,
      svelteIndentScriptAndStyle: false,
    });
  } else {
    checkedHtml = convertedContent;
  }
  let lines = checkedHtml.split('\n');
  const modifiedVARIANTS = VARIANTS.filter((value, _index, _arr) => {
    if (
      value !== 'target' &&
      value !== '@light' &&
      value !== '@dark' &&
      value !== '.light' &&
      value !== '.dark'
    ) {
      return value;
    }
  });
  const VARIANTS_REGEX = modifiedVARIANTS.map(element => element.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  const CLASS_REGEX = 'class';
  const COMBINED_REGEX = `(${CLASS_REGEX}|${VARIANTS_REGEX})`;
  const TEXT_REGEX_MATCHER = `( ${COMBINED_REGEX}=["])([^"]*)(["])`;

  for (let i = 0; i < lines.length; i++) {
    // Match windi template syntax
    let WINDI_EXPRESSION = lines[i].toString().match(/windi\`(.*?)\`/i);
    if (WINDI_EXPRESSION) {
      const INTERPRETED_WINDI_EXPRESSION = PROCESSOR.interpret(WINDI_EXPRESSION[1]);
      if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 3) {
        console.log('[DEBUG] windi expression', INTERPRETED_WINDI_EXPRESSION);
      }
      let dynamicStylesheet = globalStyleSheet(INTERPRETED_WINDI_EXPRESSION.styleSheet);
      STYLESHEETS.push(dynamicStylesheet);
    }

    // Match svelte directive css class
    let DIRECTIVE_EXPRESSION = lines[i].toString().match(/\s(class):([^=]+)/gi);
    if (DIRECTIVE_EXPRESSION) {
      for (let k = 0; k < DIRECTIVE_EXPRESSION.length; k++) {
        let DIRECTIVE_MATCH = DIRECTIVE_EXPRESSION[k].toString().match(/\s(class):([^=]+)/gi);
        const INTERPRETED_DIRECTIVE = PROCESSOR.interpret(DIRECTIVE_MATCH[2]);
        if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 4) {
          console.log('[DEBUG] directive class', INTERPRETED_DIRECTIVE);
        }
        let dynamicStylesheet = globalStyleSheet(INTERPRETED_DIRECTIVE.styleSheet);
        STYLESHEETS.push(dynamicStylesheet);
      }
    }

    const TEXT_MATCHES = lines[i].toString().match(new RegExp(TEXT_REGEX_MATCHER, 'gi'));

    if (TEXT_MATCHES) {
      for (let j = 0; j < TEXT_MATCHES.length; j++) {
        let GROUPED_MATCH = TEXT_MATCHES[j].toString().match(new RegExp(TEXT_REGEX_MATCHER, 'i'));

        if (GROUPED_MATCH) {
          if (VARIANTS.includes(GROUPED_MATCH[2])) {
            lines[i] = lines[i].replace(new RegExp(new RegExp(GROUPED_MATCH[0]), 'i'), '');
            let prefix = GROUPED_MATCH[2];
            if (prefix in MODIFIED) prefix = MODIFIED[prefix];
            let splittedVariants: string[] = GROUPED_MATCH[3].split(' ');
            let convertedVariants = splittedVariants.map(variant => {
              return `${prefix}:${variant}`;
            });
            lines[i] = lines[i].replace(
              new RegExp(new RegExp(TEXT_REGEX_MATCHER), 'i'),
              `$1$3 ${convertedVariants.join(' ')} $4`
            );
          }
        }
      }
      const FINAL_TEXT_MATCHES = lines[i].toString().match(new RegExp(TEXT_REGEX_MATCHER, 'i'));
      if (FINAL_TEXT_MATCHES) {
        let extractedClasses = FINAL_TEXT_MATCHES[3];
        if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 3) {
          console.log('[DEBUG] found class', extractedClasses);
        }
        // Match isolated inline expressions
        let INLINE_EXPRESSION = FINAL_TEXT_MATCHES[3].toString().match(/("|'|\s)[\{].*?[\}]/gi);

        // Extract classes from inline expressions
        if (INLINE_EXPRESSION) {
          extractedClasses = FINAL_TEXT_MATCHES[3].replace(/'|\?|:|{(?=[^}]+?\?).+?\?|(?<=:[^{]+?)}/gi, '');
        }

        if (OPTIONS.compile) {
          const COMPILED_CLASSES = PROCESSOR.compile(extractedClasses, OPTIONS.prefix, false);
          IGNORED_CLASSES = [...IGNORED_CLASSES, ...COMPILED_CLASSES.ignored];
          STYLESHEETS.push(COMPILED_CLASSES.styleSheet);
          let replacementValue = COMPILED_CLASSES.className
            ? [COMPILED_CLASSES.className, ...COMPILED_CLASSES.ignored].join(' ')
            : COMPILED_CLASSES.ignored.join(' ');

          lines[i] = lines[i].replace(new RegExp(TEXT_REGEX_MATCHER, 'i'), `$1${replacementValue}$4`);
        } else {
          const INTERPRETED_CLASSES = PROCESSOR.interpret(extractedClasses);
          if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 3) {
            console.log('[DEBUG] interpretation', INTERPRETED_CLASSES);
          }
          IGNORED_CLASSES = [...IGNORED_CLASSES, ...INTERPRETED_CLASSES.ignored];
          let styleSheet2 = globalStyleSheet(INTERPRETED_CLASSES.styleSheet);
          STYLESHEETS.push(styleSheet2);
        }
      }
    }
  }
  if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 5) {
    console.log('[DEBUG] returned line array', lines);
  }
  let finalContent = lines.join('\n');

  let preflights: StyleSheet = new StyleSheet();
  if (!DEV && IS_MAIN) {
    if (!OPTIONS?.silent && OPTIONS?.debug) {
      console.log('[DEBUG] production, main file, all preflights');
    }
    preflights = PROCESSOR.preflight(
      finalContent,
      true,
      FILES.length === 0 || FILES.indexOf(filename) === 0,
      true,
      false
    );
  } else if (!DEV) {
    if (!OPTIONS?.silent && OPTIONS?.debug) {
      console.log('[DEBUG] production, child file, no preflights');
    }
  } else {
    if (!OPTIONS?.silent && OPTIONS?.debug) {
      console.log('[DEBUG] development, all preflights');
    }
    preflights = PROCESSOR.preflight(
      finalContent,
      true,
      FILES.length === 0 || FILES.indexOf(filename) === 0,
      true,
      false
    );

    if (OPTIONS?.devTools?.completions) {
      if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 3) {
        console.log('[DEBUG] generate mock classes for auto completion');
      }
      let comment = '/* Windi CSS mock class names for devtools auto-completion */ '
      let completions = generateCompletions(PROCESSOR)
      let mockClasses = [
        ...completions.color,
        ...completions.static,
      ].map((name)=> {return `.${PROCESSOR.e(name)}{}`}).join('')
      let injectScript = `
        if (!document.getElementById("windicss-devtools")) {
          const style = document.createElement('style');
          style.id = "windicss-devtools";

          style.setAttribute('type', 'text/css');
          style.innerHTML = ${JSON.stringify(comment + mockClasses)};
          document.head.prepend(style);
        }
      `;
      let script = finalContent.match(/<script[^>]*?(\/|(>([\s\S]*?)<\/script))>/)?.[0]
      if (script) {
        finalContent = finalContent.replace(/\<script\>/, `<script>\n${injectScript}`)
      } else {
        finalContent += `\n\n<script>${injectScript}</script>\n\n`;
      }
    }
  }

  if (OPTIONS?.safeList) {
    const INTERPRETED_SAFELIST = PROCESSOR.interpret(OPTIONS.safeList.join(' '));
    SAFELIST.push(globalStyleSheet(INTERPRETED_SAFELIST.styleSheet));
  }

  const styleSheet = globalStyleSheet(preflights)
    .extend(combineStyleList(SAFELIST))
    .extend(combineStyleList(STYLESHEETS))
    .extend(combineStyleList(CONDITIONS));

  if (OPTIONS.bundle) {
    if (filename) BUNDLES[filename] = styleSheet;
    writeFileSync(OPTIONS.bundle, combineStyleList(Object.values(BUNDLES)).build(true));
  } else {
    finalContent += `\n\n<style>\n${styleSheet.build()}\n</style>`;
  }

  // clear lists until next call
  STYLESHEETS = [];
  CONDITIONS = [];
  if (!OPTIONS?.silent && OPTIONS?.debug) {
    console.log('[DEBUG] mainfile:', IS_MAIN);
    console.log('[DEBUG] filename:', filename);
  }

  IS_MAIN = false;
  return finalContent.toString();
}

// function _optimize(types: string, typeNodes: { [key: string]: string }) {
//   const parser = new CSSParser(types);
//   writeFileSync(BUNDLEFILE, parser.parse().build(true));
// }

// export function optimize(path: string) {
//   BUNDLEFILE = path;
//   return _optimize;
// }

export function preprocess(options: typeof OPTIONS = {}) {
  OPTIONS = { ...OPTIONS, ...options }; // change global settings here;
  DEV = process.env.NODE_ENV === 'development';
  if (process.env.NODE_ENV == undefined || process.env.NODE_ENV == 'test') {
    if (OPTIONS.mode == undefined) DEV = false;
    if (OPTIONS.mode === 'dev' || OPTIONS.mode === 'development') DEV = true;
    if (OPTIONS.mode === 'prod' || OPTIONS.mode === 'production') DEV = false;
  }
  if (!process.env.BROWSER && options?.silent === false) logging(OPTIONS);
  PROCESSOR = new Processor(loadConfig(OPTIONS.config));
  VARIANTS = [...Object.keys(PROCESSOR.resolveVariants()), ...Object.keys(MODIFIED)].filter(
    i => !Object.values(MODIFIED).includes(i)
  ); // update variants to make svelte happy
  return {
    markup: ({ content, filename }) => {
      return new Promise((resolve, _) => {
        if (!OPTIONS?.silent && OPTIONS?.debug) {
          console.log('[DEBUG] called preprocessor');
        }
        resolve({
          code: _preprocess(content, filename),
        });
      });
    },

    style: ({ content }) => {
      return new Promise((resolve, _) => {
        resolve({ code: content.replace(/@apply[\s\S]+?;/g, '') });
      });
    },
  } as {
    markup: ({ content, filename }: { content: string; filename: string }) => Promise<{ code: string }>;
    style: ({ content }: { content: string }) => Promise<{ code: string }>;
  };
}
