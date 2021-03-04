import MagicString from 'magic-string';
import { Processor } from 'windicss/lib';
import { CSSParser } from 'windicss/utils/parser';
import { loadConfig, writeFileSync, combineStyleList, globalStyleSheet, logging, convertTemplateSyntax } from './utils';
import { default as HTMLParser } from './parser';
import type { Options } from './interfaces';
import type { StyleSheet } from 'windicss/utils/style';

const DEV = process.env.NODE_ENV === 'development';

let PROCESSOR: Processor;
let VARIANTS: string[] = [];
let BUNDLEFILE: string;
let IGNORED_CLASSES: string[] = [];
let STYLESHEETS: StyleSheet[] = [];
let CONDITIONS: StyleSheet[] = [];
let FILES: (string | undefined)[] = [];
let BUNDLES: { [key: string]: StyleSheet } = {};

let OPTIONS: Options = {
  compile: false,
  prefix: 'windi-',
  globalPreflight: true,
  globalUtility: false,
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

function compilation(classNames: string) {
  const utility = PROCESSOR.compile(classNames, OPTIONS.prefix, false);
  IGNORED_CLASSES = [...IGNORED_CLASSES, ...utility.ignored];
  STYLESHEETS.push(
    OPTIONS.globalUtility && !OPTIONS.bundle ? globalStyleSheet(utility.styleSheet) : utility.styleSheet
  );
  return utility.className ? [utility.className, ...utility.ignored].join(' ') : utility.ignored.join(' '); // return new className
}

function interpretation(classNames: string) {
  const utility = PROCESSOR.interpret(classNames);
  IGNORED_CLASSES = [...IGNORED_CLASSES, ...utility.ignored];
  let styleSheet = utility.styleSheet;
  STYLESHEETS.push(OPTIONS.globalUtility && !OPTIONS.bundle ? globalStyleSheet(styleSheet) : styleSheet);
}

function addVariant(classNames: string, variant: string) {
  // prepend variant before each className
  if (variant in MODIFIED) variant = MODIFIED[variant];
  const groupRegex = /[\S]+:\([\s\S]*?\)/g;
  const groups = [...(classNames.match(groupRegex) ?? [])];
  const utilities = classNames
    .replace(groupRegex, '')
    .split(/\s+/)
    .filter(i => i);
  return [...utilities, ...groups].map(i => `${variant}:${i}`).join(' ');
}
function _preprocess(content: string, filename: string) {
  // FIXME: needs to be refactored. shouldn't remove comments completly, just for parsing
  content = content.replace(/<!--[\s\S]*?-->/g, '');
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
  const code = new MagicString(content);
  // uses new convertion, can be reverted quickly if this breaks to much bu changing to
  // old : const parser = new HTMLParser(content);
  const parser = new HTMLParser(convertTemplateSyntax(content));
  parser.parse().forEach(tag => {
    let classes: string[] = [];
    let conditionClasses: string[] = [];
    let expressions: string[] = [];
    let classStart: number | undefined;
    tag.value.forEach(node => {
      if (node.type === 'Attribute') {
        if (node.name === 'class' || node.name === 'tw') {
          classStart = node.start;
          code.overwrite(node.start, node.end, '');
          if (!Array.isArray(node.value)) node.value = [node.value];
          classes = [...classes, ...node.value.filter(i => i.type === 'Text').map(i => i.data)];
          node.value
            .filter(i => i.type === 'Expression')
            .forEach(i => {
              expressions.push(`{${i.data}}`);
              const classes = i.data.match(REGEXP.matchClasses);
              if (classes) conditionClasses = [...conditionClasses, ...classes.map(i => i.slice(1, -1))];
            });
        } else if (VARIANTS.includes(node.name)) {
          // handle variants attribute
          classStart = node.start;
          code.overwrite(node.start, node.end, '');
          if (!Array.isArray(node.value)) node.value = [node.value];
          classes = [...classes, ...node.value.filter(i => i.type === 'Text').map(i => addVariant(i.data, node.name))];
          node.value
            .filter(i => i.type === 'Expression')
            .forEach(i => {
              expressions.push(`{${i.data}}`);
              const classes = i.data.match(REGEXP.matchClasses);
              if (classes)
                conditionClasses = [...conditionClasses, ...classes.map(i => addVariant(i.slice(1, -1), node.name))];
            });
        }
      } else if (node.type === 'Directive') {
        conditionClasses.push(node.name);
      }
    });

    if (classStart) {
      if (OPTIONS.compile) {
        code.prependLeft(
          classStart,
          `class="${compilation(classes.join(' '))}${expressions.length > 0 ? expressions.join(' ') : ''}"`
        );
      } else {
        interpretation(classes.join(' '));
        code.prependLeft(
          classStart,
          `class="${classes.join(' ')}${expressions.length > 0 ? expressions.join(' ') : ''}"`
        );
      }
    }

    if (conditionClasses.length > 0) {
      const utility = PROCESSOR.interpret(conditionClasses.join(' '));
      IGNORED_CLASSES = [...IGNORED_CLASSES, ...utility.ignored];
      CONDITIONS.push(globalStyleSheet(utility.styleSheet));
    }
  });

  // preflights might lost when refresh, so develop mode will always generate all preflights
  const preflights = PROCESSOR.preflight(
    content,
    true,
    FILES.length === 0 || FILES.indexOf(filename) === 0,
    true,
    !DEV
  );

  const styleSheet = (OPTIONS.globalPreflight && !OPTIONS.bundle ? globalStyleSheet(preflights) : preflights)
    .extend(combineStyleList(STYLESHEETS))
    .extend(combineStyleList(CONDITIONS));

  if (OPTIONS.bundle) {
    if (filename) BUNDLES[filename] = styleSheet;
    writeFileSync(OPTIONS.bundle, combineStyleList(Object.values(BUNDLES)).build(true));
  } else {
    code.trimEnd().append(`\n\n<style>\n${styleSheet.build()}\n</style>`);
  }

  if (!FILES.includes(filename)) FILES.push(filename);

  // clear lists until next call
  STYLESHEETS = [];
  CONDITIONS = [];
  return code.toString();
}

function _optimize(types: string, typeNodes: { [key: string]: string }) {
  const parser = new CSSParser(types);
  writeFileSync(BUNDLEFILE, parser.parse().build(true));
}

export function preprocess(options: typeof OPTIONS = {}) {
  OPTIONS = { ...OPTIONS, ...options }; // change global settings here;
  if (!process.env.BROWSER && options?.silent === false) logging(OPTIONS);
  PROCESSOR = new Processor(loadConfig(OPTIONS.config));
  VARIANTS = [...Object.keys(PROCESSOR.resolveVariants()), ...Object.keys(MODIFIED)].filter(
    i => !Object.values(MODIFIED).includes(i)
  ); // update variants to make svelte happy

  return {
    markup: ({ content, filename }) => {
      return new Promise((resolve, _) => {
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

export function optimize(path: string) {
  BUNDLEFILE = path;
  return _optimize;
}
