// import MagicString from 'magic-string';
import { Processor } from 'windicss/lib';
import { CSSParser } from 'windicss/utils/parser';
import { StyleSheet } from 'windicss/utils/style';
import { loadConfig, writeFileSync, combineStyleList, globalStyleSheet, logging, convertTemplateSyntax } from './utils';
// import { default as HTMLParser } from './parser';
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

// function compilation(classNames: string) {
//   const utility = PROCESSOR.compile(classNames, OPTIONS.prefix, false);
//   IGNORED_CLASSES = [...IGNORED_CLASSES, ...utility.ignored];
//   STYLESHEETS.push(
//     OPTIONS.globalUtility && !OPTIONS.bundle ? globalStyleSheet(utility.styleSheet) : utility.styleSheet
//   );
//   return utility.className ? [utility.className, ...utility.ignored].join(' ') : utility.ignored.join(' '); // return new className
// }

// function interpretation(classNames: string) {
//   const utility = PROCESSOR.interpret(classNames);
//   IGNORED_CLASSES = [...IGNORED_CLASSES, ...utility.ignored];
//   let styleSheet = utility.styleSheet;
//   STYLESHEETS.push(OPTIONS.globalUtility && !OPTIONS.bundle ? globalStyleSheet(styleSheet) : styleSheet);
// }

// function addVariant(classNames: string, variant: string) {
//   // prepend variant before each className
//   if (variant in MODIFIED) variant = MODIFIED[variant];
//   const groupRegex = /[\S]+:\([\s\S]*?\)/g;
//   const groups = [...(classNames.match(groupRegex) ?? [])];
//   const utilities = classNames
//     .replace(groupRegex, '')
//     .split(/\s+/)
//     .filter(i => i);
//   return [...utilities, ...groups].map(i => `${variant}:${i}`).join(' ');
// }

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
  if (style) {
    // handle tailwind directives ...
    var global = style.match(new RegExp('global', 'g'));
    style = style.replace(/<\/?style[^>]*>/g, '');
    if (global) {
      STYLESHEETS.push(globalStyleSheet(new CSSParser(style, PROCESSOR).parse()));
    } else {
      STYLESHEETS.push(new CSSParser(style, PROCESSOR).parse());
    }
    content = content.replace(REGEXP.matchStyle, '');
  }

  //const code = new MagicString(content);
  // uses new convertion, can be reverted quickly if this breaks to much bu changing to
  // old : const parser = new HTMLParser(content);

  let convertedContent = convertTemplateSyntax(content);
  let checkedHtml;
  if (!process.env.BROWSER) {
    // console.log(convertedContent);
    const { format } = require('prettier');
    // checkedHtml = format(convertedContent, {
    //   parser: 'svelte',
    //   pluginSearchDirs: ['.'],
    //   plugin: [require('prettier-plugin-svelte')],
    //   printWidth: 9999,
    //   tabWidth: 2,
    //   svelteStrictMode: true,
    //   svelteAllowShorthand: false,
    //   svelteBracketNewLine: false,
    //   svelteIndentScriptAndStyle: false,
    // });
    checkedHtml = convertedContent;
  } else {
    checkedHtml = convertedContent;
  }
  // console.log(checkedHtml);
  let lines = checkedHtml.split('\n');
  const modifiedVARIANTS = VARIANTS.filter((value, index, arr) => {
    if (
      value !== 'target' &&
      value !== '@light' &&
      value !== '@dark' &&
      value !== '.light' &&
      value !== '.dark' &&
      value !== 'even' &&
      value !== 'even-of-type'
    ) {
      return value;
    }
  });
  const VARIANTS_REGEX = modifiedVARIANTS.map(element => element.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  // const CLASS_REGEX = 'class|className';
  const CLASS_REGEX = 'class';
  const COMBINED_REGEX = `(${CLASS_REGEX}|${VARIANTS_REGEX})`;
  const TEXT_REGEX_MATCHER = `(${COMBINED_REGEX}=["])([^"]*)(["])`;
  // FIXME: EXPRESSION REGEX
  //const EXPRESSION_REGEX_MATCHER = `(${COMBINED_REGEX}=[\{])(.*)([\}])`;

  for (let i = 0; i < lines.length; i++) {
    const TEXT_MATCHES = lines[i].toString().match(new RegExp(TEXT_REGEX_MATCHER, 'gi'));
    //const EXPRESSION_MATCHES = lines[i].toString().match(new RegExp(EXPRESSION_REGEX_MATCHER, 'gi'));

    if (TEXT_MATCHES) {
      // console.log(TEXT_MATCHES);
      for (let j = 0; j < TEXT_MATCHES.length; j++) {
        // // console.log('line', lines[i]);
        // // console.log('handling Match', TEXT_MATCHES[j]);
        let GROUPED_MATCH = TEXT_MATCHES[j].toString().match(new RegExp(TEXT_REGEX_MATCHER, 'i'));
        // // console.log(GROUPED_MATCH);

        if (GROUPED_MATCH) {
          if (VARIANTS.includes(GROUPED_MATCH[2])) {
            // // console.log(GROUPED_MATCH);

            // prepend variant before each className
            // if (variant in MODIFIED) variant = MODIFIED[variant];
            // const groupRegex = /[\S]+:\([\s\S]*?\)/g;
            // const groups = [...(classNames.match(groupRegex) ?? [])];
            // const utilities = classNames
            //   .replace(groupRegex, '')
            //   .split(/\s+/)
            //   .filter(i => i);
            // return [...utilities, ...groups].map(i => `${variant}:${i}`).join(' ');
            lines[i] = lines[i].replace(new RegExp(new RegExp(GROUPED_MATCH[0]), 'i'), '');
            let prefix = GROUPED_MATCH[2];
            if (prefix in MODIFIED) prefix = MODIFIED[prefix];
            let splittedVariants: string[] = GROUPED_MATCH[3].split(' ');
            let convertedVariants = splittedVariants.map(variant => {
              return `${prefix}:${variant}`;
            });
            // // console.log(convertedVariants);
            // // console.log(convertedVariants);
            lines[i] = lines[i].replace(
              new RegExp(new RegExp(TEXT_REGEX_MATCHER), 'i'),
              `$1$3 ${convertedVariants.join(' ')} $4`
            );
            // // console.log('new Line', lines[i]);
          }
        }
      }
      const FINAL_TEXT_MATCHES = lines[i].toString().match(new RegExp(TEXT_REGEX_MATCHER, 'i'));
      if (FINAL_TEXT_MATCHES) {
        // console.log(FINAL_TEXT_MATCHES);
        let extractedClasses = FINAL_TEXT_MATCHES[3];
        let INLINE_EXPRESSION = FINAL_TEXT_MATCHES[3].toString().match(/([\{].*?[\}])/gi);
        if (INLINE_EXPRESSION) {
          // console.log(INLINE_EXPRESSION);
          extractedClasses = FINAL_TEXT_MATCHES[3].replace(/('|:|\}|[\{].*?\?)/gi, '');
        }
        if (OPTIONS.compile) {
          const COMPILED_CLASSES = PROCESSOR.compile(extractedClasses, OPTIONS.prefix, false);
          IGNORED_CLASSES = [...IGNORED_CLASSES, ...COMPILED_CLASSES.ignored];
          STYLESHEETS.push(COMPILED_CLASSES.styleSheet);
          let replacementValue = COMPILED_CLASSES.className
            ? [COMPILED_CLASSES.className, ...COMPILED_CLASSES.ignored].join(' ')
            : COMPILED_CLASSES.ignored.join(' ');

          lines[i] = lines[i].replace(new RegExp(TEXT_REGEX_MATCHER, 'i'), `$1${replacementValue}$4`);
          // // console.log(lines[i]);
        } else {
          // console.log(extractedClasses);

          const INTERPRETED_CLASSES = PROCESSOR.interpret(extractedClasses);
          // console.log(INTERPRETED_CLASSES);
          IGNORED_CLASSES = [...IGNORED_CLASSES, ...INTERPRETED_CLASSES.ignored];
          let styleSheet = INTERPRETED_CLASSES.styleSheet;
          STYLESHEETS.push(styleSheet);
        }
      }
    }
  }

  let finalContent = lines.join('\n');

  // // preflights might lost when refresh, so develop mode will always generate all preflights
  // const preflights = PROCESSOR.preflight(
  //   finalContent,
  //   true,
  //   FILES.length === 0 || FILES.indexOf(filename) === 0,
  //   true,
  //   !DEV
  // );

  let preflights: StyleSheet = new StyleSheet();
  if (!DEV && IS_MAIN) {
    if (OPTIONS?.debug) {
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
    if (OPTIONS?.debug) {
      console.log('[DEBUG] production, child file, no preflights');
    }
  } else {
    if (OPTIONS?.debug) {
      console.log('[DEBUG] development, all preflights');
    }
    preflights = PROCESSOR.preflight(
      finalContent,
      true,
      FILES.length === 0 || FILES.indexOf(filename) === 0,
      true,
      false
    );
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
  if (OPTIONS?.debug) {
    console.log('[DEBUG] mainfile:', IS_MAIN);
    console.log('[DEBUG] filename:', filename);
  }

  IS_MAIN = false;
  // console.log(finalContent.toString());
  return finalContent.toString();

  // ##### OLD
  // const parser = new HTMLParser(convertTemplateSyntax(content));
  // parser.parse().forEach(tag => {
  //   let classes: string[] = [];
  //   let conditionClasses: string[] = [];
  //   let expressions: string[] = [];
  //   let classStart: number | undefined;
  //   tag.value.forEach(node => {
  //     if (node.type === 'Attribute') {
  //       if (node.name === 'class' || node.name === 'tw') {
  //         classStart = node.start;
  //         code.overwrite(node.start, node.end, '');
  //         if (!Array.isArray(node.value)) node.value = [node.value];
  //         classes = [...classes, ...node.value.filter(i => i.type === 'Text').map(i => i.data)];
  //         node.value
  //           .filter(i => i.type === 'Expression')
  //           .forEach(i => {
  //             expressions.push(`{${i.data}}`);
  //             const classes = i.data.match(REGEXP.matchClasses);
  //             if (classes) conditionClasses = [...conditionClasses, ...classes.map(i => i.slice(1, -1))];
  //           });
  //       } else if (VARIANTS.includes(node.name)) {
  //         // handle variants attribute
  //         classStart = node.start;
  //         code.overwrite(node.start, node.end, '');
  //         if (!Array.isArray(node.value)) node.value = [node.value];
  //         classes = [...classes, ...node.value.filter(i => i.type === 'Text').map(i => addVariant(i.data, node.name))];
  //         node.value
  //           .filter(i => i.type === 'Expression')
  //           .forEach(i => {
  //             expressions.push(`{${i.data}}`);
  //             const classes = i.data.match(REGEXP.matchClasses);
  //             if (classes)
  //               conditionClasses = [...conditionClasses, ...classes.map(i => addVariant(i.slice(1, -1), node.name))];
  //           });
  //       }
  //     } else if (node.type === 'Directive') {
  //       conditionClasses.push(node.name);
  //     }
  //   });

  //   if (classStart) {
  //     if (OPTIONS.compile) {
  //       code.prependLeft(
  //         classStart,
  //         `class="${compilation(classes.join(' '))}${expressions.length > 0 ? ' ' + expressions.join(' ') : ''}"`
  //       );
  //     } else {
  //       interpretation(classes.join(' '));
  //       code.prependLeft(
  //         classStart,
  //         `class="${classes.join(' ')}${expressions.length > 0 ? ' ' + expressions.join(' ') : ''}"`
  //       );
  //     }
  //   }

  //   if (conditionClasses.length > 0) {
  //     const utility = PROCESSOR.interpret(conditionClasses.join(' '));
  //     IGNORED_CLASSES = [...IGNORED_CLASSES, ...utility.ignored];
  //     CONDITIONS.push(globalStyleSheet(utility.styleSheet));
  //   }
  // });

  // // preflights might lost when refresh, so develop mode will always generate all preflights
  // const preflights = PROCESSOR.preflight(
  //   content,
  //   true,
  //   FILES.length === 0 || FILES.indexOf(filename) === 0,
  //   true,
  //   !DEV
  // );

  // const styleSheet = (OPTIONS.globalPreflight && !OPTIONS.bundle ? globalStyleSheet(preflights) : preflights)
  //   .extend(combineStyleList(STYLESHEETS))
  //   .extend(combineStyleList(CONDITIONS));

  // if (OPTIONS.bundle) {
  //   if (filename) BUNDLES[filename] = styleSheet;
  //   writeFileSync(OPTIONS.bundle, combineStyleList(Object.values(BUNDLES)).build(true));
  // } else {
  //   code.trimEnd().append(`\n\n<style>\n${styleSheet.build()}\n</style>`);
  // }

  // if (!FILES.includes(filename)) FILES.push(filename);
}

function _optimize(types: string, typeNodes: { [key: string]: string }) {
  const parser = new CSSParser(types);
  writeFileSync(BUNDLEFILE, parser.parse().build(true));
}

export function optimize(path: string) {
  BUNDLEFILE = path;
  return _optimize;
}

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
        if (OPTIONS?.debug) {
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
