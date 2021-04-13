import Processor from 'windicss';
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


export class Magician {
  processor: Processor
  content: string
  filename: string
  isBundled: boolean = false
  isCompiled: boolean = false
  lines: string[] = []
  constructor(processor: Processor, content: string, filename: string) {
    this.processor = processor
    this.content = content
    this.filename = filename
  }

  clean() {

    return this
  }

  format() {
    // TODO: ERROR HANDLING
    // TODO: better formatting.. no upstream fix of prettier-plugin expected soon
    // https://github.com/sveltejs/prettier-plugin-svelte/issues/214

    let tmpContent = this.content

    // Tags on one line
    tmpContent = tmpContent.replace(/(?<=[\<]{1}\w[^\>]+)\n/gmi, " ")

    // FIXME: Debug utils lib
    // if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 5) {
    //   console.log('[DEBUG] raw input', convertedContent);
    // }
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
    // FIXME: Debug utils lib
    // if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 4) {
    //   console.log(checkedHtml);
    // }
    this.content = formatedContent
    return this
  }
  processStyle(clean: boolean = true) {

    return this
  }
  split() {
    // TODO: ERROR HANDLING
    let tmpContent = this.content
    this.lines = tmpContent.split('\n');
    return this
  }

  generatePreflight() {

    return this
  }

  processSafelist() {

    return this
  }

  processWindiExpression() {

    return this
  }

  processDirectiveClass() {

    return this
  }

  processWindiAttribute() {

    return this
  }

  processClassAttribute() {
    // handle expression
    return this
  }

  compile() {

    return this
  }

  bundle() {

    return this
  }

  useDevTools() {

    return this
  }

  useKit() {

    return this
  }

  useGlobal() {

  }

  getCode() {
    return this.content
  }

  getFilename() {
    return this.filename
  }
}