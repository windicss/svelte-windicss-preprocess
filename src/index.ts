import { useConfig, createLog } from "@nbhr/utils";
// import {   } from "nodeuse";
import { readFileSync } from "fs";
import { Processor } from 'windicss/lib';
import type { FullConfig } from "windicss/types/interfaces";
import { CSSParser } from 'windicss/utils/parser';
import { StyleSheet } from 'windicss/utils/style';
import { combineStyleList, globalStyleSheet, logging, Magician, writeFileSync } from './utils';

export interface Options {
  safeList?: string[];
  bundle?: string;
  mode?: string;
  debug?: boolean;
  silent?: boolean; // in readme
  config?: string; // in readme
  compile?: boolean; // in readme
  prefix?: string; // in readme
  verbosity?: number; // TODO: add mapping in docs for people
  devTools?: {
    completions?: boolean;
    enabled?: boolean;
  },
  kit?: boolean,
  disableFormat?: boolean
}

let OPTIONS: Options = {
  safeList: undefined,
  bundle: undefined,
  compile: false,
  prefix: 'windi-',
  verbosity: 1,
  debug: false,
  devTools: undefined,
  disableFormat: false
};

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
let isInit: boolean = false;
let windiConfig: FullConfig = {}

const REGEXP = {
  matchStyle: /<style[^>]*?(\/|(>([\s\S]*?)<\/style))>/,
  matchScript: /<script[^>]*?(\/|(>([\s\S]*?)<\/script))>/,
  matchClasses: /('[\s\S]+?')|("[\s\S]+?")|(`[\s\S]+?`)/g,
};
let table: any = {}
let size: any = 0
let file: any = 0

// const MODIFIED: { [key: string]: string } = {
//   xxl: '2xl',
//   'tw-disabled': 'disabled',
//   'tw-required': 'required',
//   'tw-checked': 'checked',
// };

function _preprocess(content: string, filename: string) {

  // // TODO: add magician logic
  let run = "new"
  if (run == "new") {
    let mag = new Magician(PROCESSOR, content, filename, windiConfig).clean()
    if (!(OPTIONS?.disableFormat)) mag = mag.format()
    if (!DEV && IS_MAIN) {
      mag = mag
        .generatePreflight()
      IS_MAIN = false
    } else if (DEV) {
      mag = mag
        .generatePreflight()
    }
    mag = mag
      .processStyle()
    mag = mag
      .each(line => {
        return line
          // .processWindiExpression()
          .processDirectiveClass()
          .processAttributify()
          .processClassAttribute()
          .compute()
      })
    if (OPTIONS?.safeList) mag = mag.processSafelist()
    mag = mag
      .compute()
    // console.log(mag.getCode())
    if (DEV && OPTIONS?.devTools?.enabled) mag = mag.useDevTools()
    // Ends the timer and print the time
    // taken by the piece of code

    table[filename] = mag.getStats()
    size = (4 * file) + Object.entries(table).length - 1
    process.stdout.moveCursor(0, -size) // up one line
    process.stdout.clearLine(1) // from cursor to end
    console.table(table)
    file = 1
    return mag
      .getCode()
  } else {

    // FIXME: needs to be refactored. shouldn't remove comments completly, just for parsing
    // removes comments
    content = content.replace(/<!--[\s\S]*?-->/g, '');

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
      // TODO: better formatting.. no upstream fix of prettier-plugin expected soon
      // https://github.com/sveltejs/prettier-plugin-svelte/issues/214
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
      if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 4) {
        console.log(checkedHtml);
      }
    } else {
      checkedHtml = convertedContent;
    }
    let lines = checkedHtml.split('\n');
    const modifiedVARIANTS = VARIANTS.filter((value, _index, _arr) => {
      if (
        value === 'sm' ||
        value === '-sm' ||
        value === '+sm' ||
        value === 'md' ||
        value === '-md' ||
        value === '+md' ||
        value === 'lg' ||
        value === '-lg' ||
        value === '+lg' ||
        value === 'xl' ||
        value === '-xl' ||
        value === '+xl' ||
        value === 'light' ||
        value === 'dark' ||
        value === 'checked' ||
        value === 'hover' ||
        value === 'visited' ||
        value === 'focus'
      ) {
        return true
      } else {
        return false
      }
    }).map(value => `w:${value.toString()}`);
    const VARIANTS_REGEX = modifiedVARIANTS.map(element => element).join('|');
    const CLASS_REGEX = 'class';
    const COMBINED_REGEX = `(${CLASS_REGEX}|${VARIANTS_REGEX})`;
    const TEXT_REGEX_MATCHER = `( ${COMBINED_REGEX}=["])([^"]*)(["])`;
    // if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 3) {
    //   console.log('[DEBUG] regex parse matcher', TEXT_REGEX_MATCHER);
    // }
    for (let i = 0; i < lines.length; i++) {
      // Match windi template syntax
      let WINDI_EXPRESSION = lines[i].toString().match(/windi\`(.*?)\`/i);
      if (WINDI_EXPRESSION) {
        const INTERPRETED_WINDI_EXPRESSION = PROCESSOR.interpret(WINDI_EXPRESSION[1]);
        if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 3) {
          console.log('[DEBUG] windi expression', INTERPRETED_WINDI_EXPRESSION);
        }
        let dynamicStylesheet
        if (OPTIONS.kit) {
          dynamicStylesheet = INTERPRETED_WINDI_EXPRESSION.styleSheet;
        } else {
          dynamicStylesheet = globalStyleSheet(INTERPRETED_WINDI_EXPRESSION.styleSheet);
        }
        STYLESHEETS.push(dynamicStylesheet);
      }

      // Match svelte directive css class
      let DIRECTIVE_EXPRESSION = lines[i].toString().match(/\s(class):([^=]+)/gi);
      if (DIRECTIVE_EXPRESSION) {
        for (let k = 0; k < DIRECTIVE_EXPRESSION.length; k++) {
          let DIRECTIVE_MATCH = DIRECTIVE_EXPRESSION[k].toString().match(/\s(class):([^=]+)/i);
          const INTERPRETED_DIRECTIVE = PROCESSOR.interpret(DIRECTIVE_MATCH[2]);
          if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 4) {
            console.log('[DEBUG] directive class', INTERPRETED_DIRECTIVE);
          }
          let dynamicStylesheet
          if (OPTIONS.kit) {
            dynamicStylesheet = INTERPRETED_DIRECTIVE.styleSheet;
          } else {
            dynamicStylesheet = globalStyleSheet(INTERPRETED_DIRECTIVE.styleSheet);
          }
          STYLESHEETS.push(dynamicStylesheet);
        }
      }


      const TEXT_MATCHES = lines[i].toString().match(new RegExp(TEXT_REGEX_MATCHER, 'gi'));
      if (TEXT_MATCHES) {
        // if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 3) {
        //   console.log('[DEBUG] TEXT_MATCHES', TEXT_MATCHES);
        // }
        for (let j = 0; j < TEXT_MATCHES.length; j++) {
          let GROUPED_MATCH = TEXT_MATCHES[j].toString().match(new RegExp(TEXT_REGEX_MATCHER, 'i'));

          if (GROUPED_MATCH) {
            if (modifiedVARIANTS.includes(GROUPED_MATCH[2])) {
              lines[i] = lines[i].replace(new RegExp(new RegExp(GROUPED_MATCH[0]), 'i'), '');
              let prefix = GROUPED_MATCH[2].replace("w:", "");
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
          // if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 3) {
          //   console.log('[DEBUG] FINAL_TEXT_MATCHES', FINAL_TEXT_MATCHES);
          // }
          let extractedClasses = FINAL_TEXT_MATCHES[3];
          if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 3) {
            console.log('[DEBUG] extractedClasses', extractedClasses);
          }
          // Match isolated inline expressions
          let INLINE_EXPRESSION = FINAL_TEXT_MATCHES[3].toString().match(/("|'|\s)[\{].*?[\}]/gi);
          // Extract classes from inline expressions
          if (INLINE_EXPRESSION) {
            if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 3) {
              console.log('[DEBUG] INLINE_EXPRESSION', INLINE_EXPRESSION, " -> ", FINAL_TEXT_MATCHES[3]);
            }
            extractedClasses = FINAL_TEXT_MATCHES[3].replace(/{(?=[^{]+? [\w|']+})|(?<={\w+ [^{]+?)}|(?<={\w+ [^{]*?)['|:|\?]/gi, '');
            if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 3) {
              console.log('[DEBUG] INLINE_EXPRESSION CLEAN', extractedClasses);
            }
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
            let styleSheet2
            if (OPTIONS.kit) {
              styleSheet2 = INTERPRETED_CLASSES.styleSheet;
            } else {
              styleSheet2 = globalStyleSheet(INTERPRETED_CLASSES.styleSheet);
            }
            STYLESHEETS.push(styleSheet2);
          }
        }
      }
    }
    // if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 5) {
    //   console.log('[DEBUG] returned line array', lines);
    // }

    let finalContent = lines.join('\n');

    let preflights: StyleSheet = new StyleSheet();
    if (!DEV && IS_MAIN) {
      if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 1) {
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
      if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 1) {
        console.log('[DEBUG] production, child file, no preflights');
      }
    } else {
      if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! >= 1) {
        console.log('[DEBUG] development, all preflights');
      }
      preflights = PROCESSOR.preflight(
        finalContent,
        true,
        FILES.length === 0 || FILES.indexOf(filename) === 0,
        true,
        false
      );

      if (OPTIONS?.devTools?.enabled) {
        const path = require.resolve("windicss-runtime-dom");
        let windiProjectConfig = undefined;
        // if (OPTIONS.config) {
        //   windiProjectConfig = loadConfig(OPTIONS.config)
        // }
        let windiRuntimeDom = readFileSync(path, "utf-8");
        let windiRuntimeDomConfig = `
        window.windicssRuntimeOptions = {
          extractInitial: false,
          preflight: false,
          mockClasses: ${OPTIONS?.devTools?.completions ? true : false},
          config: ${windiProjectConfig ? JSON.stringify(windiProjectConfig) : undefined}
        }
      `
        let injectScript = `
        if (!document.getElementById("windicss-devtools")) {
          const script = document.createElement("script");
          script.id = "windicss-devtools";
          script.setAttribute("type", "text/javascript");
          script.innerHTML = ${JSON.stringify(windiRuntimeDomConfig + windiRuntimeDom)};
          document.head.append(script);
        }
      `;
        let script = finalContent.match(REGEXP.matchScript)?.[0]
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

    let styleSheet
    if (OPTIONS.kit) {
      styleSheet = globalStyleSheet(preflights)
        .extend(combineStyleList(SAFELIST))
        .extend(combineStyleList(STYLESHEETS))
        .extend(combineStyleList(CONDITIONS));
    } else {
      styleSheet = globalStyleSheet(preflights)
        .extend(combineStyleList(SAFELIST))
        .extend(combineStyleList(STYLESHEETS))
        .extend(combineStyleList(CONDITIONS));
    }

    if (OPTIONS.bundle) {
      if (filename) BUNDLES[filename] = styleSheet;
      writeFileSync(OPTIONS.bundle, combineStyleList(Object.values(BUNDLES)).build(true));
    } else {
      finalContent += `\n\n<style>\n${styleSheet.build()}\n</style>\n`;
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
}

export function preprocess(options: typeof OPTIONS = {}) {
  PROCESSOR = new Processor(windiConfig);
  OPTIONS = { ...OPTIONS, ...options }; // change global settings here;
  DEV = process.env.NODE_ENV === 'development';
  if (OPTIONS.mode) {
    if (OPTIONS.mode == undefined) DEV = false;
    if (OPTIONS.mode === 'dev' || OPTIONS.mode === 'development') DEV = true;
    if (OPTIONS.mode === 'prod' || OPTIONS.mode === 'production') DEV = false;
  }
  // TODO: rework logging information block
  // log if verbosity is 0
  if (options?.silent === false) logging(OPTIONS);
  //TODO:
  // useEnv.set("windi:verbosity", OPTIONS.verbosity || -1)
  return {
    markup: ({ content, filename }) => {
      return new Promise(async (resolve, _) => {
        // useDebug.info("svelte preprocessor lifecycle called", 1)
        if (!OPTIONS?.silent && OPTIONS?.debug) {
          // createLog('[DEBUG] called preprocessor')
        }
        if (isInit == false) {
          //TODO:
          // useDebug.warn("windicss compile init not complete yet", 1)
          if (!OPTIONS?.silent && OPTIONS?.debug) {
            // createLog("[DEBUG] initialisationPending")
          }
          if (OPTIONS.config) {
            const loadedConfig = await useConfig.load(OPTIONS.config)
            windiConfig = loadedConfig
            //TODO:
            // if (error) useDebug.error()
            // useDebug.info("windicss configuration file loaded", 1)
            // useDebug.info("\n" +loadedConfig, 2)
            if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! > 3) {
              // console.log("[DEBUG] loaded config data", windiConfig)
            }
          } else {
            PROCESSOR = new Processor();
          }
          // const loadedConfig = await loadConfiguration({ config: OPTIONS.config })

          VARIANTS = [...Object.keys(PROCESSOR.resolveVariants())];
          isInit = true
        } else if (!OPTIONS?.silent && OPTIONS?.debug) {
          //TODO:
          // useDebug.info("windicss compile init complete", 1)
          // createLog("[DEBUG] initialisationDone")
        }
        resolve({
          code: _preprocess(content, filename),
        });
      });
    },

    style: ({ content }) => {
      return new Promise((resolve, _) => {
        // potential not needed
        resolve({ code: content.replace(/@apply[\s\S]+?;/g, '') });
      });
    },
  } as {
    markup: ({ content, filename }: { content: string; filename: string }) => Promise<{ code: string }>;
    style: ({ content }: { content: string }) => Promise<{ code: string }>;
  };
}
