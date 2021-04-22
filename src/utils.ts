import Processor from 'windicss';
import { CSSParser } from 'windicss/utils/parser';
import { StyleSheet } from 'windicss/utils/style';
import type { Options } from './interfaces';

export function combineStyleList(stylesheets: StyleSheet[]) {
  return stylesheets
    .reduce((previousValue, currentValue) => previousValue.extend(currentValue), new StyleSheet())
    .combine(); //.sort();
}

export function globalStyleSheet(styleSheet: StyleSheet) {
  // turn all styles in stylesheet to global style
  styleSheet.children.forEach(style => {
    if (!style.rule.includes(':global') && style.meta.group !== 'keyframes') {
      style.wrapRule((rule: string) => `:global(${rule})`);
    }
  });
  return styleSheet;
}

export function writeFileSync(path: string, data: string) {
  if (!process.env.BROWSER) return require('fs').writeFileSync(path, data);
}

export function chalkColor() {
  const chalk = require('chalk');
  return {
    blueBold: (text: string) => chalk.hex('#0ea5e9').bold(text),
    blackBold: (text: string) => chalk.hex('#000').bold(text),
    yellowBold: (text: string) => chalk.hex('#FFB11B').bold(text),
    redBold: (text: string) => chalk.hex('#FF4000').bold(text),
    green: (text: string) => chalk.hex('#00D17A')(text),
    gray: (text: string) => chalk.hex('#717272')(text),
  };
}

export function logging(options: Options) {
  const chalk = chalkColor();
  process.stdout.write(`${chalk.blueBold('│')}\n`);
  process.stdout.write(`${chalk.blueBold('│')} ${chalk.blueBold('svelte-windicss-preprocess')}\n`);
  process.stdout.write(
    `${chalk.blueBold('│')} ${process.env.NODE_ENV == undefined ? chalk.redBold('NODE_ENV is undefined') : ''}\n`
  );
  process.stdout.write(
    `${chalk.blueBold('│')} ${chalk.blackBold('-')} windicss running mode: ${process.env.NODE_ENV === 'development'
      ? chalk.yellowBold('dev')
      : process.env.NODE_ENV === 'production'
        ? chalk.green('prod')
        : chalk.yellowBold('process.env.NODE_ENV check failed (check setup)')
    }\n`
  );
  process.stdout.write(
    `${chalk.blueBold('│')} ${chalk.blackBold('-')} advanced debug logs: ${options?.debug === true ? chalk.yellowBold('on') : chalk.green('off')
    }\n`
  );

  process.stdout.write(
    `${chalk.blueBold('│')}    ${chalk.blackBold('•')} compilation mode: ${options?.compile == true ? chalk.gray('enabled') : chalk.gray('disabled')
    }\n`
  );
  process.stdout.write(
    `${chalk.blueBold('│')}    ${chalk.blackBold('•')} class prefix: ${options?.prefix ? chalk.gray(options.prefix) : chalk.yellowBold('not set')
    }\n`
  );

  process.stdout.write(`${chalk.blueBold('│')}\n`);
  process.stdout.write(`${chalk.blueBold('└──────────')}\n`);
}


class Step {
  processor: Processor
  content: string
  filename: string
  extraClassList: string = ""
  mainClassList: string = ""
  mainStyle: StyleSheet = new StyleSheet()
  extraStyle: StyleSheet = new StyleSheet()
  constructor(processor: Processor, content: string, filename: string) {
    this.processor = processor
    this.content = content
    this.filename = filename
    // TODO: Debug utils lib
  }
  processWindiExpression() {
    // TODO: ERROR HANDLING
    // TODO: Debug utils lib

    // let WINDI_EXPRESSION = lines[i].toString().match(/windi\`(.*?)\`/i);
    // if (WINDI_EXPRESSION) {
    //   const INTERPRETED_WINDI_EXPRESSION = PROCESSOR.interpret(WINDI_EXPRESSION[1]);
    // }

    return this
  }

  processDirectiveClass() {
    // TODO: ERROR HANDLING
    // TODO: Debug utils lib

    // let DIRECTIVE_EXPRESSION = lines[i].toString().match(/\s(class):([^=]+)/gi);
    // if (DIRECTIVE_EXPRESSION) {
    //   for (let k = 0; k < DIRECTIVE_EXPRESSION.length; k++) {
    //     let DIRECTIVE_MATCH = DIRECTIVE_EXPRESSION[k].toString().match(/\s(class):([^=]+)/i);
    //     const INTERPRETED_DIRECTIVE = PROCESSOR.interpret(DIRECTIVE_MATCH[2]);
    //   }
    // }

    return this
  }

  processWindiAttribute() {
    // TODO: ERROR HANDLING
    // TODO: Debug utils lib

    // VARIANTS = [...Object.keys(PROCESSOR.resolveVariants())];
    // const modifiedVARIANTS = VARIANTS.filter((value, _index, _arr) => {
    //   if (
    //     value === 'sm' ||
    //     value === '-sm' ||
    //     value === '+sm' ||
    //     value === 'md' ||
    //     value === '-md' ||
    //     value === '+md' ||
    //     value === 'lg' ||
    //     value === '-lg' ||
    //     value === '+lg' ||
    //     value === 'xl' ||
    //     value === '-xl' ||
    //     value === '+xl' ||
    //     value === 'light' ||
    //     value === 'dark' ||
    //     value === 'checked' ||
    //     value === 'hover' ||
    //     value === 'visited' ||
    //     value === 'focus'
    //   ) {
    //     return true
    //   } else {
    //     return false
    //   }
    // }).map(value => `w:${value.toString()}`);
    // const VARIANTS_REGEX = modifiedVARIANTS.map(element => element).join('|');
    // const CLASS_REGEX = 'class';
    // const COMBINED_REGEX = `(${CLASS_REGEX}|${VARIANTS_REGEX})`;
    // const TEXT_REGEX_MATCHER = `( ${COMBINED_REGEX}=["])([^"]*)(["])`;
    // FIXME: windiAttributeREGEX
    // const TEXT_MATCHES = lines[i].toString().match(new RegExp(TEXT_REGEX_MATCHER, 'gi'));
    // for (let j = 0; j < TEXT_MATCHES.length; j++) {
    //   let GROUPED_MATCH = TEXT_MATCHES[j].toString().match(new RegExp(TEXT_REGEX_MATCHER, 'i'));

    //   if (GROUPED_MATCH) {
    //     if (modifiedVARIANTS.includes(GROUPED_MATCH[2])) {
    //       lines[i] = lines[i].replace(new RegExp(new RegExp(GROUPED_MATCH[0]), 'i'), '');
    //       let prefix = GROUPED_MATCH[2].replace("w:", "");
    //       let splittedVariants: string[] = GROUPED_MATCH[3].split(' ');
    //       let convertedVariants = splittedVariants.map(variant => {
    //         return `${prefix}:${variant}`;
    //       });
    //       lines[i] = lines[i].replace(
    //         new RegExp(new RegExp(TEXT_REGEX_MATCHER), 'i'),
    //         `$1$3 ${convertedVariants.join(' ')} $4`
    //       );
    //     }
    //   }
    // }

    return this
  }

  processClassAttribute() {
    // TODO: ERROR HANDLING
    // TODO: Debug utils lib

    // const CLASS_REGEX = 'class';
    // const COMBINED_REGEX = `(${CLASS_REGEX}|${VARIANTS_REGEX})`;
    // const TEXT_REGEX_MATCHER = `( ${COMBINED_REGEX}=["])([^"]*)(["])`;
    // FIXME: CLASS_REGEX
    // const FINAL_TEXT_MATCHES = lines[i].toString().match(new RegExp(TEXT_REGEX_MATCHER, 'i'));
    // if (FINAL_TEXT_MATCHES) {
    //   // if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 3) {
    //   //   console.log('[DEBUG] FINAL_TEXT_MATCHES', FINAL_TEXT_MATCHES);
    //   // }
    //   let extractedClasses = FINAL_TEXT_MATCHES[3];
    //   if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 3) {
    //     console.log('[DEBUG] extractedClasses', extractedClasses);
    //   }
    //   // Match isolated inline expressions
    //   let INLINE_EXPRESSION = FINAL_TEXT_MATCHES[3].toString().match(/("|'|\s)[\{].*?[\}]/gi);
    //   // Extract classes from inline expressions
    //   if (INLINE_EXPRESSION) {
    //     if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 3) {
    //       console.log('[DEBUG] INLINE_EXPRESSION', INLINE_EXPRESSION, " -> ", FINAL_TEXT_MATCHES[3]);
    //     }
    //     extractedClasses = FINAL_TEXT_MATCHES[3].replace(/{(?=[^{]+? [\w|']+})|(?<={\w+ [^{]+?)}|(?<={\w+ [^{]*?)['|:|\?]/gi, '');
    //     if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 3) {
    //       console.log('[DEBUG] INLINE_EXPRESSION CLEAN', extractedClasses);
    //     }
    //   }

    //   if (OPTIONS.compile) {
    //     const COMPILED_CLASSES = PROCESSOR.compile(extractedClasses, OPTIONS.prefix, false);
    //     IGNORED_CLASSES = [...IGNORED_CLASSES, ...COMPILED_CLASSES.ignored];
    //     STYLESHEETS.push(COMPILED_CLASSES.styleSheet);
    //     let replacementValue = COMPILED_CLASSES.className
    //       ? [COMPILED_CLASSES.className, ...COMPILED_CLASSES.ignored].join(' ')
    //       : COMPILED_CLASSES.ignored.join(' ');

    //     lines[i] = lines[i].replace(new RegExp(TEXT_REGEX_MATCHER, 'i'), `$1${replacementValue}$4`);
    //   } else {
    //     const INTERPRETED_CLASSES = PROCESSOR.interpret(extractedClasses);
    //     if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 3) {
    //       console.log('[DEBUG] interpretation', INTERPRETED_CLASSES);
    //     }
    //     IGNORED_CLASSES = [...IGNORED_CLASSES, ...INTERPRETED_CLASSES.ignored];
    //     let styleSheet2
    //     if (OPTIONS.kit) {
    //       styleSheet2 = INTERPRETED_CLASSES.styleSheet;
    //     } else {
    //       styleSheet2 = globalStyleSheet(INTERPRETED_CLASSES.styleSheet);
    //     }
    //     STYLESHEETS.push(styleSheet2);
    //   }
    // }

    return this
  }

  compute(compile: boolean = false) {
    // TODO: ERROR HANDLING

    // FIXME: interpret once
    // dynamicStylesheet = INTERPRETED_DIRECTIVE.styleSheet;
    this.extraStyle = this.processor.interpret("").styleSheet
    this.mainStyle = this.processor.interpret("").styleSheet

    return {
      line: this.content,
      stylesheet: this.mainStyle,
      extraStylesheet: this.extraStyle
    }
  }
}

export class Magician {
  processor: Processor
  content: string
  filename: string
  isBundled: boolean = false
  isCompiled: boolean = false
  lines: string[] = []
  stylesheets: StyleSheet[] = []
  constructor(processor: Processor, content: string, filename: string) {
    this.processor = processor
    this.content = content
    this.filename = filename
    // TODO: Debug utils lib
  }

  clean() {
    // TODO: ERROR HANDLING
    // TODO: Debug utils lib

    let tmpContent = this.content

    // FIXME: needs to be refactored. shouldn't remove comments completly, just for parsing
    tmpContent = tmpContent.replace(/<!--[\s\S]*?-->/g, '');
    tmpContent = tmpContent.replace(/([!\w][\w:_/-]*?):\(([\w\s/-]*?)\)/gm, (_, groupOne: string, groupTwo: string) =>
      groupTwo
        .split(/\s/g)
        .map(cssClass => `${groupOne}:${cssClass}`)
        .join(' ')
    );

    this.content = tmpContent
    return this
  }

  format() {
    // TODO: ERROR HANDLING
    // TODO: better formatting.. no upstream fix of prettier-plugin expected soon
    // https://github.com/sveltejs/prettier-plugin-svelte/issues/214
    // TODO: Debug utils lib

    let tmpContent = this.content

    tmpContent = tmpContent.replace(/(?<=[\<]{1}\w[^\>]+)\n/gmi, " ")
    const prettier = require('prettier');
    let formatedContent = prettier.format(tmpContent, {
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

    this.content = formatedContent
    return this
  }

  processStyle() {
    // TODO: ERROR HANDLING
    // TODO: Debug utils lib

    let tmpContent = this.content

    let style = tmpContent.match(/<style[^>]*?(\/|(>([\s\S]*?)<\/style))>/)?.[0];
    if (style) {
      var global = style.match(/\<style global\>/gi);
      style = style.replace(/<\/?style[^>]*>/g, '');
      if (global) {
        this.stylesheets.push(this.useGlobal(new CSSParser(style, this.processor).parse()));
      } else {
        this.stylesheets.push(new CSSParser(style, this.processor).parse());
      }
      tmpContent = tmpContent.replace(/<style[^>]*?(\/|(>([\s\S]*?)<\/style))>/, '');
    }

    this.content = tmpContent
    return this
  }

  each(callbackfn: (line: Step) => { line: string, stylesheet: StyleSheet, extraStylesheet: StyleSheet }) {
    // TODO: ERROR HANDLING

    let tmpContent = this.content

    this.lines = tmpContent.split('\n');
    this.lines.forEach(el => {
      // let result
      const { line, stylesheet, extraStylesheet } = callbackfn(new Step(this.processor, el, this.filename))
      el = line
      this.stylesheets.push(extraStylesheet)
      this.stylesheets.push(stylesheet)
    })
    tmpContent = this.lines.join('\n');
    this.content = tmpContent

    return this
  }

  compile() {
    // TODO: ERROR HANDLING

    return this
  }

  bundle() {
    // TODO: ERROR HANDLING

    return this
  }

  generatePreflight() {
    // TODO: ERROR HANDLING

    return this
  }

  processSafelist() {
    // TODO: ERROR HANDLING


    //   const INTERPRETED_SAFELIST = PROCESSOR.interpret(OPTIONS.safeList.join(' '));
    //   SAFELIST.push(globalStyleSheet(INTERPRETED_SAFELIST.styleSheet));


    return this
  }

  useDevTools() {
    // TODO: ERROR HANDLING


    //   const path = require.resolve("windicss-runtime-dom");
    //   let windiProjectConfig = undefined;
    //   // if (OPTIONS.config) {
    //   //   windiProjectConfig = loadConfig(OPTIONS.config)
    //   // }
    //   let windiRuntimeDom = readFileSync(path, "utf-8");
    //   let windiRuntimeDomConfig = `
    //     window.windicssRuntimeOptions = {
    //       extractInitial: false,
    //       preflight: false,
    //       mockClasses: ${OPTIONS?.devTools?.completions ? true : false},
    //       config: ${windiProjectConfig ? JSON.stringify(windiProjectConfig) : undefined}
    //     }
    //   `
    //   let injectScript = `
    //     if (!document.getElementById("windicss-devtools")) {
    //       const script = document.createElement("script");
    //       script.id = "windicss-devtools";
    //       script.setAttribute("type", "text/javascript");
    //       script.innerHTML = ${JSON.stringify(windiRuntimeDomConfig + windiRuntimeDom)};
    //       document.head.append(script);
    //     }
    //   `;
    //   let script = finalContent.match(REGEXP.matchScript)?.[0]
    //   if (script) {
    //     finalContent = finalContent.replace(/\<script\>/, `<script>\n${injectScript}`)
    //   } else {
    //     finalContent += `\n\n<script>${injectScript}</script>\n\n`;
    //   }


    return this
  }

  useKit() {
    // TODO: ERROR HANDLING

    return this
  }

  useGlobal(styleSheet: StyleSheet) {
    // TODO: ERROR HANDLING
    // turn all styles in stylesheet to global style
    styleSheet.children.forEach(style => {
      if (!style.rule.includes(':global') && style.meta.group !== 'keyframes') {
        style.wrapRule((rule: string) => `:global(${rule})`);
      }
    });
    return styleSheet;
  }

  getCode() {
    // TODO: ERROR HANDLING

    return this.content
  }

  getFilename() {
    // TODO: ERROR HANDLING

    return this.filename
  }
}
