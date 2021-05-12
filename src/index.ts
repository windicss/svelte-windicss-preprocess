import { useConfig } from "@nbhr/utils";
import { readFileSync } from "fs";
import type { PreprocessorGroup } from "svelte/types/compiler/preprocess";
import { Processor } from 'windicss/lib';
import type { FullConfig } from "windicss/types/interfaces";
import { CSSParser } from 'windicss/utils/parser';
import { StyleSheet } from 'windicss/utils/style';
import { combineStyleList, globalStyleSheet, logging, Magician } from './utils';

export interface Options {
  safeList?: string[];
  bundle?: string;
  mode?: string;
  debug?: boolean;
  silent?: boolean;
  config?: string;
  compile?: boolean;
  prefix?: string;
  verbosity?: number;
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
let CSS_SOURCE: string = ""
let CSS_STYLESHEETS: StyleSheet = new StyleSheet()

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
    let mag = new Magician(PROCESSOR, content, filename, windiConfig)
    mag = mag.clean()
    if (!(OPTIONS?.disableFormat)) mag = mag.format()
    //FIXME: style preprocessor
    // if (!DEV && IS_MAIN) {
    //   mag = mag
    //     .generatePreflight()
    //   IS_MAIN = false
    // } else if (DEV) {
    //   mag = mag
    //     .generatePreflight()
    // }
    mag = mag
      .extractStyle()
    CSS_SOURCE = mag.getExtracted()
    mag = mag
      .each(line => {
        return line
          // .processWindiExpression()
          .processDirectiveClass()
          .processAttributify()
          .processClassAttribute()
          .compute()
      })
    //FIXME: style preprocessor
    // if (OPTIONS?.safeList) mag = mag.processSafelist()
    mag = mag
      .compute()
    // console.log(mag.getCode())
    if (DEV && OPTIONS?.devTools?.enabled) mag = mag.useDevTools()

    // table[filename] = mag.getStats()
    // size = (4 * file) + Object.entries(table).length - 1
    // process.stdout.moveCursor(0, -size) // up one line
    // process.stdout.clearLine(1) // from cursor to end
    // console.table(table)
    // file = 1

    CSS_STYLESHEETS = mag.getComputed()


    // console.log("----");
    // console.log(mag.getCode());


    return mag
      .getCode()
  } else {
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

    // let WINDI_EXPRESSION = lines[i].toString().match(/windi\`(.*?)\`/i);
    //   if (WINDI_EXPRESSION) {
    //     const INTERPRETED_WINDI_EXPRESSION = PROCESSOR.interpret(WINDI_EXPRESSION[1]);
    //     if (!OPTIONS?.silent && OPTIONS?.debug && OPTIONS?.verbosity! == 3) {
    //       console.log('[DEBUG] windi expression', INTERPRETED_WINDI_EXPRESSION);
    //     }
    //     let dynamicStylesheet
    //     if (OPTIONS.kit) {
    //       dynamicStylesheet = INTERPRETED_WINDI_EXPRESSION.styleSheet;
    //     } else {
    //       dynamicStylesheet = globalStyleSheet(INTERPRETED_WINDI_EXPRESSION.styleSheet);
    //     }
    //     STYLESHEETS.push(dynamicStylesheet);
    //   }

    // const COMPILED_CLASSES = PROCESSOR.compile(extractedClasses, OPTIONS.prefix, false);
    // IGNORED_CLASSES = [...IGNORED_CLASSES, ...COMPILED_CLASSES.ignored];
    // STYLESHEETS.push(COMPILED_CLASSES.styleSheet);
    // let replacementValue = COMPILED_CLASSES.className
    //   ? [COMPILED_CLASSES.className, ...COMPILED_CLASSES.ignored].join(' ')
    //   : COMPILED_CLASSES.ignored.join(' ');

    // lines[i] = lines[i].replace(new RegExp(TEXT_REGEX_MATCHER, 'i'), `$1${replacementValue}$4`);
    return ""
  }
}

export function windi(options: typeof OPTIONS = {}): PreprocessorGroup {
  PROCESSOR = new Processor()
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
            PROCESSOR.loadConfig(windiConfig)
          } else {
            PROCESSOR.loadConfig()
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
          code: _preprocess(content, filename)
        });
      });
    },

    style: ({ content, attributes, markup }) => {
      // console.log(attributes)
      return new Promise(async (resolve, _) => {
        let PREFLIGHTS_STYLE = ""
        let SAFELIST_STYLE = ""
        let CSS_STYLE = ""
        let INLINE_STYLE = ""

        // MARK: PREFLIGHTS
        if (attributes["windi:preflights"] || attributes["windi:preflights:global"]) {
          let PREFLIGHTS = PROCESSOR.preflight(
            markup,
            true,
            true,
            true,
            false
          )
          if (attributes["windi:preflights:global"]) {
            PREFLIGHTS_STYLE = globalStyleSheet(PREFLIGHTS).build()
          } else {
            PREFLIGHTS_STYLE = PREFLIGHTS.build()
          }
        }

        // TODO: MARK: SAFELIST
        if (attributes["windi:safelist"] || attributes["windi:safelist:global"]) {
          if (OPTIONS.safeList) {
            const SAFELIST = PROCESSOR.interpret(OPTIONS.safeList.join(' ')).styleSheet;
            if (attributes["windi:safelist:global"]) {
              SAFELIST_STYLE = globalStyleSheet(SAFELIST).build()
            } else {
              SAFELIST_STYLE = SAFELIST.build()
            }
          }
        }

        // MARK: CUSTOM CSS + WINDI @apply
        if (CSS_SOURCE) {
          let CSS = new CSSParser(CSS_SOURCE, PROCESSOR).parse()
          if (attributes["global"]) {
            CSS_STYLE = globalStyleSheet(CSS).build()
          } else {
            CSS_STYLE = CSS.build()
          }
        }

        // MARK: WINDI CSS
        if (CSS_STYLESHEETS) {
          if (attributes["windi:global"]) {
            INLINE_STYLE = globalStyleSheet(CSS_STYLESHEETS).build()
          } else {
            INLINE_STYLE = CSS_STYLESHEETS.build()
          }
        }
        resolve({
          code: `${PREFLIGHTS_STYLE}\n\n${SAFELIST_STYLE}\n\n${CSS_STYLE}\n\n${INLINE_STYLE}`
          // code: content.replace(/@apply[\s\S]+?;/g, '')
        });
      });
    },
  }
}
