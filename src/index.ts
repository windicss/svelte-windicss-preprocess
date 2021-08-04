import { useConfig, useDebugger } from '@nbhr/utils'
import { readFileSync } from 'fs'
import type { PreprocessorGroup } from 'svelte/types/compiler/preprocess'
import { Processor } from 'windicss/lib'
import type { FullConfig } from 'windicss/types/interfaces'
import { CSSParser } from 'windicss/utils/parser'
import { StyleSheet } from 'windicss/utils/style'
import { globalStyleSheet, Magician } from './utils'

export interface Options {
  silent?: boolean
  mode?: 'development' | 'production'
  configPath?: string
  disableFormat?: boolean
  devTools?: {
    enabled: boolean
    completions?: boolean
  }
  //
  safeList?: string
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
    enabled: false,
  },
  safeList: undefined,
  preflights: true,
  // bundle: undefined,
  // compile: false,
  // prefix: 'windi-',
  // verbosity: 1,
  // debug: false,
}

let DEV = false
let PROCESSOR: Processor

let windiConfig: FullConfig
let CSS_SOURCE = ''
const CSS_STYLESHEETS: Map<string, { lastmodified: Date; code: StyleSheet }> = new Map()

function _preprocess(content: string, filename: string) {
  let mag = new Magician(PROCESSOR, content, filename, windiConfig)
  mag = mag.prepare()
  mag = mag.setInject()
  // mag = mag.each(line => {
  //   return line.processWindiExpression().processDirectiveClass().processAttributify().processClassAttribute().compute()
  // })
  mag = mag.processClassAttribute().processDirectiveClass().processWindiExpression()
  mag = mag.processAttributify()
  mag = mag.compute()
  CSS_STYLESHEETS.set(filename, { code: mag.getComputedStyleSheet(), lastmodified: new Date() })
  return mag.getCode()
}

// Svelte evaluates preprocessors by running all markup preprocessors first,
// then script and finally styles.
// Some preprocesses may not work if other preprocessors haven't been run.
// Currently that means we need to run the preprocessors in the right order, using svelte-sequential-preprocessor
// TODO: move all logic back into markup
export function windi(options: typeof OPTIONS = {}): PreprocessorGroup {
  PROCESSOR = new Processor()
  OPTIONS = { ...OPTIONS, ...options }
  DEV = false

  if (process.env.NODE_ENV === 'production') DEV = false
  if (process.env.NODE_ENV === 'development') DEV = true
  if (OPTIONS.mode === 'production') DEV = false
  if (OPTIONS.mode === 'development') DEV = true

  return {
    markup: ({ content, filename }) => {
      return new Promise(resolve => {
        if (windiConfig != undefined) {
          resolve({
            code: _preprocess(content, filename),
          })
        } else {
          if (OPTIONS.configPath) {
            useDebugger.createLog('Trying to load windi configuration from ' + OPTIONS.configPath)
            useConfig
              .load<FullConfig>(OPTIONS.configPath)
              .then(config => {
                if (config.preflight === false) OPTIONS.preflights = false
                if (config.safelist && typeof config.safelist == 'string') {
                  OPTIONS.safeList = config.safelist
                } else if (config.safelist) {
                  const tmpSafelist = config.safelist as (string | string[])[]
                  OPTIONS.safeList = [...new Set(tmpSafelist.flat(Infinity))].join(' ')
                }
                PROCESSOR.loadConfig(config)
                useDebugger.createLog('Configuration loaded successfully')
                windiConfig = config
              })
              .catch(e => {
                useDebugger.createLog('Unknown Error while loading the config')
                console.error(e)
              })
              .finally(() => {
                resolve({
                  code: _preprocess(content, filename),
                })
              })
          } else {
            PROCESSOR.loadConfig()
            resolve({
              code: _preprocess(content, filename),
            })
          }
        }
      })
    },
    script: ({ content, attributes }) => {
      return new Promise(resolve => {
        if (DEV === true && OPTIONS.devTools && OPTIONS.devTools.enabled !== false && attributes['windi:devtools']) {
          const path = require.resolve('windicss-runtime-dom')
          let runtimeConfig: FullConfig
          if (windiConfig !== undefined) {
            runtimeConfig = {
              theme: windiConfig.theme,
            }
          } else {
            runtimeConfig = {}
          }
          const windiRuntimeDom = readFileSync(path, 'utf-8')
          const windiRuntimeDomConfig = `
              window.windicssRuntimeOptions = {
                extractInitial: false,
                preflight: false,
                mockClasses: true,
                config: ${JSON.stringify(runtimeConfig)}
              }
            `
          const injectScript = `
              if (!document.getElementById("windicss-devtools")) {
                const script = document.createElement("script");
                script.id = "windicss-devtools";
                script.setAttribute("type", "text/javascript");
                script.innerHTML = ${JSON.stringify(windiRuntimeDomConfig + windiRuntimeDom)};
                document.head.append(script);
              }
            `
          resolve({
            code: injectScript + '\n' + content,
          })
        } else {
          resolve({
            code: content,
          })
        }
      })
    },
    style: ({ content, attributes, filename }) => {
      return new Promise(resolve => {
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
          const globalMatches = [...(tmpCSS.matchAll(/:global\((?<selector>.*)\).*{(?<css>[^}]*)}/gim) || [])]
            .map(el => {
              return `${el.groups?.selector} {${el.groups?.css}}`
            })
            .join('\n')
          const globalCSS = new CSSParser(globalMatches, PROCESSOR).parse()
          const buildGlobalCSS = globalStyleSheet(globalCSS).build()
          if (buildGlobalCSS.length > 0) CSS_STYLE += buildGlobalCSS + '\n'
          // local styles
          const scopedMatches = tmpCSS.replace(/:global\([^}]*}/gim, '')
          CSS = new CSSParser(scopedMatches, PROCESSOR).parse()
          const buildLocalCSS = CSS.build()
          if (buildLocalCSS.length > 0) CSS_STYLE += buildLocalCSS
        }

        // MARK: WINDI CSS
        if (filename && CSS_STYLESHEETS.has(filename) && attributes['windi:global']) {
          const FILESHEET = CSS_STYLESHEETS.get(filename)!
          INLINE_STYLE = globalStyleSheet(FILESHEET['code']).build()
        } else if (filename && CSS_STYLESHEETS.has(filename)) {
          const FILESHEET = CSS_STYLESHEETS.get(filename)!
          INLINE_STYLE = FILESHEET['code'].build()
        }

        // MARK: COMBINE
        let newStyleCode = '\n'
        if (PREFLIGHTS_STYLE.length > 0) newStyleCode += PREFLIGHTS_STYLE + '\n'
        if (SAFELIST_STYLE.length > 0) newStyleCode += SAFELIST_STYLE + '\n'
        if (CSS_STYLE.length > 0) newStyleCode += CSS_STYLE + '\n'
        if (INLINE_STYLE.length > 0) newStyleCode += INLINE_STYLE + '\n'

        resolve({
          code: newStyleCode,
        })
      })
    },
  }
}

export default windi
