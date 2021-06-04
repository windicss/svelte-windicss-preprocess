import { useConfig } from '@nbhr/utils'
import { readFileSync } from 'fs'
import type { PreprocessorGroup } from 'svelte/types/compiler/preprocess'
import { Processor } from 'windicss/lib'
import type { FullConfig } from 'windicss/types/interfaces'
import { CSSParser } from 'windicss/utils/parser'
import { StyleSheet } from 'windicss/utils/style'
import { combineStyleList, globalStyleSheet, logging, Magician } from './utils'

export interface Options {
  silent?: boolean,
  mode?: 'development' | 'production',
  configPath?: string,
  disableFormat?: boolean,
  devTools?: {
    enabled: boolean,
    completions?: boolean,
  },
  //
  safeList?: string,
  preflights?: boolean
  // bundle?: string;
  // debug?: boolean;
  // compile?: boolean;
  // prefix?: string;
  // verbosity?: number;
}

let OPTIONS: Options = {
  silent: false,
  // mode
  // configPath
  disableFormat: false,
  devTools: {
    enabled: false
  },
  safeList: undefined,
  preflights: true
  // bundle: undefined,
  // compile: false,
  // prefix: 'windi-',
  // verbosity: 1,
  // debug: false,
}

let DEV = false
let PROCESSOR: Processor
// let VARIANTS: string[] = [];
// let BUNDLEFILE: string;
// let IGNORED_CLASSES: string[] = [];
// let STYLESHEETS: StyleSheet[] = [];
// let CONDITIONS: StyleSheet[] = [];
// let SAFELIST: StyleSheet[] = [];
// let FILES: (string | undefined)[] = [];
// let BUNDLES: { [key: string]: StyleSheet } = {};
// let IS_MAIN: boolean = true;
let isInit = false
let windiConfig: FullConfig = {}
let CSS_SOURCE = ''
let CSS_STYLESHEETS: StyleSheet = new StyleSheet()

const REGEXP = {
  matchStyle: /<style[^>]*?(\/|(>([\s\S]*?)<\/style))>/,
  matchScript: /<script[^>]*?(\/|(>([\s\S]*?)<\/script))>/,
  matchClasses: /('[\s\S]+?')|("[\s\S]+?")|(`[\s\S]+?`)/g,
}
const table: any = {}
const size: any = 0
const file: any = 0

function _preprocess(content: string, filename: string) {

  // // TODO: add magician logic
  const run = 'new'
  if (run == 'new') {
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
    mag = mag.setInject()
    // mag = mag
    //   .extractStyle()
    // CSS_SOURCE = mag.getExtracted()
    mag = mag
      .each(line => {
        return line
          .processWindiExpression()
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

    // const COMPILED_CLASSES = PROCESSOR.compile(extractedClasses, OPTIONS.prefix, false);
    // IGNORED_CLASSES = [...IGNORED_CLASSES, ...COMPILED_CLASSES.ignored];
    // STYLESHEETS.push(COMPILED_CLASSES.styleSheet);
    // let replacementValue = COMPILED_CLASSES.className
    //   ? [COMPILED_CLASSES.className, ...COMPILED_CLASSES.ignored].join(' ')
    //   : COMPILED_CLASSES.ignored.join(' ');

    // lines[i] = lines[i].replace(new RegExp(TEXT_REGEX_MATCHER, 'i'), `$1${replacementValue}$4`);
    return ''
  }
}


// Svelte evaluates preprocessors by running all markup preprocessors first,
// then script and finally styles.
// Some preprocesses may not work if other preprocessors haven't been run.
export function windi(options: typeof OPTIONS = {}): PreprocessorGroup {
  PROCESSOR = new Processor()
  OPTIONS = { ...OPTIONS, ...options } // change global settings here;
  DEV = false

  if (process.env.NODE_ENV === 'production')  DEV = false
  if ( process.env.NODE_ENV === 'development') DEV = true
  if (OPTIONS.mode === 'production') DEV = false
  if (OPTIONS.mode === 'development') DEV = true
  if (options?.silent === false) logging(OPTIONS)

  return {
    markup: ({ content, filename }) => {
      return new Promise((resolve) => {
        if (OPTIONS.configPath) {
          useConfig.load<FullConfig>(OPTIONS.configPath).then(config => {
            if (config.preflight === false) OPTIONS.preflights = false
            if (config.safelist && typeof config.safelist == 'string') {
              OPTIONS.safeList = config.safelist
            } else if (config.safelist) {
              const tmpSafelist = config.safelist as (string | string[])[]
              OPTIONS.safeList = [...new Set(tmpSafelist.flat(Infinity))].join(' ')
            }
            PROCESSOR.loadConfig(config)
            windiConfig = config
            // isInit = true
          }).finally(() => {
            resolve({
              code: _preprocess(content, filename)
            })
          })
        } else {
          PROCESSOR.loadConfig()
          // isInit = true
          resolve({
            code: _preprocess(content, filename)
          })
        }
      })
    },
    script: ({ content, attributes, markup }) => {
      return new Promise((resolve) => {

        resolve({
          code: content
        })
      })
    },
    style: ({ content, attributes, markup, filename }) => {
      return new Promise((resolve) => {
        let PREFLIGHTS_STYLE = ''
        let SAFELIST_STYLE = ''
        let CSS_STYLE = ''
        let INLINE_STYLE = ''

        // MARK: PREFLIGHTS
        if (OPTIONS.preflights === true && attributes['windi:preflights:global']) {
          const PREFLIGHTS = PROCESSOR.preflight()
          PREFLIGHTS_STYLE = globalStyleSheet(PREFLIGHTS).build()
        } else if (OPTIONS.preflights === true && attributes['windi:preflights']) {
          const PREFLIGHTS = PROCESSOR.preflight()
          PREFLIGHTS_STYLE = PREFLIGHTS.build()
        }

        // MARK: SAFELIST
        if (OPTIONS.safeList && attributes['windi:safelist:global']) {
          const SAFELIST = PROCESSOR.interpret(OPTIONS.safeList).styleSheet
          SAFELIST_STYLE = globalStyleSheet(SAFELIST).build()
          console.log(SAFELIST_STYLE)
        } else if (OPTIONS.safeList && attributes['windi:safelist']) {
          const SAFELIST = PROCESSOR.interpret(OPTIONS.safeList).styleSheet
          SAFELIST_STYLE = SAFELIST.build()
        }

        // MARK: CUSTOM CSS + WINDI @apply
        let CSS: StyleSheet
        CSS_SOURCE = content
        if (CSS_SOURCE && attributes['global']) {
          CSS = new CSSParser(CSS_SOURCE, PROCESSOR).parse()
          CSS_STYLE = globalStyleSheet(CSS).build()
        } else if (CSS_SOURCE) {
          const tmpCSS = CSS_SOURCE
          // global styles
          const globalMatches = [...tmpCSS.matchAll(/:global\((?<selector>.*)\).*{(?<css>[^}]*)}/gmi) || []].map(el => {
            return `${el.groups?.selector} {${el.groups?.css}}`
          }).join('\n')
          const globalCSS = new CSSParser(globalMatches, PROCESSOR).parse()
          const buildGlobalCSS = globalStyleSheet(globalCSS).build()
          if(buildGlobalCSS.length > 0) CSS_STYLE += buildGlobalCSS + '\n'
          // local styles
          const scopedMatches = tmpCSS.replace(/:global\([^}]*}/gmi, '')
          CSS = new CSSParser(scopedMatches, PROCESSOR).parse()
          const buildLocalCSS = CSS.build()
          if(buildLocalCSS.length > 0) CSS_STYLE += buildLocalCSS
        }

        // MARK: WINDI CSS
        if (CSS_STYLESHEETS && attributes['windi:global']) {
          INLINE_STYLE = globalStyleSheet(CSS_STYLESHEETS).build()
        } else if (CSS_STYLESHEETS) {
          INLINE_STYLE = CSS_STYLESHEETS.build()
        }

        // MARK: COMBINE
        let newStyleCode = '\n'
        if(PREFLIGHTS_STYLE.length > 0) newStyleCode += PREFLIGHTS_STYLE + '\n'
        if(SAFELIST_STYLE.length > 0) newStyleCode += SAFELIST_STYLE + '\n'
        if(CSS_STYLE.length > 0) newStyleCode += CSS_STYLE + '\n'
        if(INLINE_STYLE.length > 0) newStyleCode += INLINE_STYLE + '\n'

        resolve({
          code: newStyleCode
        })
      })
    }
  }
}
