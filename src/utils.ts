import { StyleSheet } from 'windicss/utils/style';
import type { Options } from './interfaces';

export function searchNotEscape(text: string, char = '{') {
  if (text.charAt(0) === char) return 0;
  const index = text.search(new RegExp(String.raw`([^\\]${char})`));
  if (index === -1) return -1;
  return index + 1;
}

export function searchGroup(text: string) {
  let level = 1;
  let index = 0;
  let endBracket = searchNotEscape(text, '}');
  while (endBracket !== -1) {
    let nextBracket = searchNotEscape(text.slice(index), '{');
    if (endBracket < nextBracket || nextBracket === -1) {
      level--;
      index = endBracket + 1;
      if (level == 0) return endBracket;
    } else {
      level++;
      index = nextBracket + 1;
    }
    endBracket = searchNotEscape(text.slice(index), '}');
  }
  return -1;
}

export function combineStyleList(stylesheets: StyleSheet[]) {
  return stylesheets
    .reduce((previousValue, currentValue) => previousValue.extend(currentValue), new StyleSheet())
    .combine(); //.sort();
}

export function globalStyleSheet(styleSheet: StyleSheet) {
  // turn all styles in stylesheet to global style
  styleSheet.children.forEach(style => {
    if (!style.rule.includes(':global')) {
      style.wrapRule((rule: string) => `:global(${rule})`);
    }
  });
  return styleSheet;
}

export function writeFileSync(path: string, data: string) {
  if (!process.env.BROWSER) return require('fs').writeFileSync(path, data);
}

export function loadConfig(config?: string) {
  if (process.env.BROWSER) return config;
  return config ? require(require('path').resolve(config)) : undefined;
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
  process.stdout.write(
    `${chalk.blueBold('│')} ${chalk.blueBold('svelte-windicss-preprocess')} - v${require('./package.json').version}\n`
  );
  process.stdout.write(
    `${chalk.blueBold('│')} ${process.env.NODE_ENV == undefined ? chalk.redBold('NODE_ENV is undefined') : ''}\n`
  );
  process.stdout.write(
    `${chalk.blueBold('│')} ${chalk.blackBold('-')} windicss running mode: ${
      process.env.NODE_ENV === 'development' ? chalk.yellowBold('dev') : chalk.green('prod')
    }\n`
  );
  process.stdout.write(
    `${chalk.blueBold('│')} ${chalk.blackBold('-')} advanced debug logs: ${
      options?.debug === true ? chalk.yellowBold('on') : chalk.green('off')
    }\n`
  );
  if (options?.debug === true) {
    process.stdout.write(
      `${chalk.blueBold('│')}    ${chalk.blackBold('•')} compilation mode: ${
        options?.compile == true ? chalk.gray('enabled') : chalk.gray('disabled')
      }\n`
    );
    process.stdout.write(
      `${chalk.blueBold('│')}    ${chalk.blackBold('•')} class prefix: ${
        options?.prefix ? chalk.gray(options.prefix) : chalk.yellowBold('not set')
      }\n`
    );
    process.stdout.write(
      `${chalk.blueBold('│')}    ${chalk.blackBold('•')} global preflights: ${
        options?.globalPreflight == true ? chalk.gray('enabled') : chalk.gray('disabled')
      }\n`
    );
    process.stdout.write(
      `${chalk.blueBold('│')}    ${chalk.blackBold('•')} global utilities: ${
        options?.globalUtility == true ? chalk.gray('enabled') : chalk.gray('disabled')
      }\n`
    );
  }
  process.stdout.write(`${chalk.blueBold('│')}\n`);
  process.stdout.write(`${chalk.blueBold('└──────────')}\n`);
}

export function convertTemplateSyntax(content: string): string {
  // converts content temporarily from special svelte syntax to more generic syntax for parsing ...
  // from : <div class={`green ${myClass ? 'red' : 'green'}`}>Should be red!</div>
  // to : <div class="green {myClass ? 'red' : 'green'}">Should be red!</div>

  // needs make sure length and position are the same, so replacing with spaces
  // let splittedContent = content.split('\n');
  // for (let line of splittedContent) {
  //   let dynamicContent = line.match(/windi`(.*?)`/i);
  //   if (dynamicContent) {
  //     let shade = 40;
  //     let splittedDynamicContent = dynamicContent[1]?.split(' ');
  //     let convertedString = windi`${splittedDynamicContent}`;
  //     console.log(convertedString);
  //     line = line.replace(/(?<!windi`.*)\$/, windi`${splittedDynamicContent}`);
  //     console.log(line);
  //   }
  // }
  // let parsedContent = splittedContent.join('\n');
  let parsedContent = content;
  parsedContent = parsedContent.replace(/windi`.*`/g, '');
  parsedContent = parsedContent.replace(/\{`/g, '" ');
  parsedContent = parsedContent.replace(/`\}/g, ' "');
  parsedContent = parsedContent.replace(/(?<!windi`.*)\$/g, ' ');
  return parsedContent;
}
