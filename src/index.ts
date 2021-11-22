import type { IconifyJSON } from '@iconify/types'
// import { useConfig, useDebugger } from '@nbhr/utils'
import type { UnoGenerator } from '@unocss/core'
import { createGenerator } from '@unocss/core'
import UnocssIcons from '@unocss/preset-icons'
import fg from 'fast-glob'
import { readFileSync } from 'fs'
import { parse, preprocess } from 'svelte/compiler'
import type {
  PreprocessorGroup,
  Processed,
} from 'svelte/types/compiler/preprocess'
import { Processor } from 'windicss/lib'
// import type { FullConfig } from 'windicss/types/interfaces'
import { CSSParser } from 'windicss/utils/parser'
import { StyleSheet } from 'windicss/utils/style'
import { globalStyleSheet, Magician, SetObject } from './utils'

// const DEV = false
// let windiConfig: FullConfig
// let configMTime: number
// let OPTIONS: BaseConfig

// function loadConfig(path: string): Promise<void> {
//   useDebugger.createLog('Trying to load windi configuration from ' + path)
//   return useConfig.load<FullConfig>(path).then(config => {
//     // write current unix timestamp to configMTime
//     configMTime = Date.now()
//     if (config.preflight === false) OPTIONS.preflights = false
//     if (config.safelist && typeof config.safelist == 'string') {
//       OPTIONS.safeList = config.safelist
//     } else if (config.safelist) {
//       const tmpSafelist = config.safelist as (string | string[])[]
//       OPTIONS.safeList = [...new Set(tmpSafelist.flat(Infinity))].join(' ')
//     }
//     console.log(config)
//     console.log(JSON.stringify(config.theme))
//     PROCESSOR.loadConfig(config)
//     useDebugger.createLog('Configuration loaded successfully')
//     windiConfig = config
//   })
// }

let entryFileName = ''

interface generatorObject {
  data: SetObject
  updatedAt: number
  writtenAt?: number
}

const raw = new Map<string, generatorObject>([
  [
    '__GLOBAL',
    {
      data: {
        inlineClasses: new Set(),
        inlineDirectives: new Set(),
        inlineExpressions: new Set(),
        inlineIcons: new Set(),
        inlineAttributify: new Map(),
      },
      updatedAt: Date.now(),
    },
  ],
])

function agent(): PreprocessorGroup {
  let result: SetObject
  return {
    async markup({ content, filename }): Promise<Processed> {
      let worker = new Magician(content, filename, configuration)
      worker = worker.prepare()
      // worker = worker.setInject()
      worker = worker.extract()
      result = worker.getSets()
      raw.set(filename, {
        data: result,
        updatedAt: Date.now(),
      })

      return {
        code: content,
      }
    },
  }
}

async function generateCSS(
  key: string,
  attributes: Record<string, string | boolean>
) {
  const t = raw.get(key)

  // MARK: WINDI DEFAULT
  //   const FILESHEET = CSS_STYLESHEETS.get(filename || '') || undefined
  //   if (FILESHEET && attributes['windi:global']) {
  //     INLINE_STYLE = globalStyleSheet(FILESHEET['code']).build()
  //   } else if (FILESHEET) {
  //     INLINE_STYLE = FILESHEET['code'].build()
  //   }
  const defaultStyleSheet = generatorWindi.interpret(
    Array.from(
      new Set([
        ...(t?.data.inlineClasses || new Set()),
        ...(t?.data.inlineDirectives || new Set()),
        ...(t?.data.inlineExpressions || new Set()),
      ])
    ).join(' ')
  ).styleSheet
  let defaultStyles = ''
  if (attributes['windi:global'] || attributes['windi-inline-global']) {
    defaultStyles = globalStyleSheet(defaultStyleSheet).build()
  } else {
    defaultStyles = defaultStyleSheet.build()
  }

  // MARK: ATTRIBUTIFY
  const nObj: Record<string, string[]> = {}
  t?.data.inlineAttributify.forEach((v: Set<string>, k: string) => {
    nObj[k] = Array.from(v)
  })

  const attributifyStyleSheet = generatorWindi.attributify(nObj).styleSheet
  let attributifyStyles = ''
  if (attributes['windi:global'] || attributes['windi-inline-global']) {
    attributifyStyles = globalStyleSheet(attributifyStyleSheet).build()
  } else {
    attributifyStyles = attributifyStyleSheet.build()
  }

  // MARK: ICONS (experimental)
  let iconStyles = ''
  if (generatorUno && configuration.experimental?.icons != undefined) {
    iconStyles = await generatorUno
      .generate(t?.data.inlineIcons || '')
      .then(resolve => resolve.css)
  }
  return { defaultStyles, attributifyStyles, iconStyles }
}

function main(): PreprocessorGroup {
  if (configuration.experimental?.scan !== undefined) {
    const files = fg.sync(['src/**/*.svelte'], {})
    for (const file of files) {
      const content = readFileSync(file).toString()
      const filename = file
      const ast = parse(content, { filename })
      const hasGlobalInline = ast.css.attributes.some(
        el => el.name == 'windi-inline-global'
      )
      console.log(filename, hasGlobalInline)
      let worker = new Magician(content, filename, configuration)
      worker = worker.prepare()
      worker = worker.extract()
      const result = worker.getSets()
      if (hasGlobalInline) {
        const global = raw.get('__GLOBAL')!.data
        raw.set('__GLOBAL', {
          data: {
            inlineClasses: new Set([
              ...global.inlineClasses,
              ...result.inlineClasses,
            ]),
            inlineDirectives: new Set([
              ...global.inlineDirectives,
              ...result.inlineDirectives,
            ]),
            inlineExpressions: new Set([
              ...global.inlineExpressions,
              ...result.inlineExpressions,
            ]),
            inlineIcons: new Set([
              ...global.inlineIcons,
              ...result.inlineIcons,
            ]),
            inlineAttributify: new Map([
              ...global.inlineAttributify,
              ...result.inlineAttributify,
            ]),
          },
          updatedAt: Date.now(),
        })
        raw.set(filename, {
          data: {
            inlineClasses: new Set(),
            inlineDirectives: new Set(),
            inlineExpressions: new Set(),
            inlineIcons: new Set(),
            inlineAttributify: new Map(),
          },
          updatedAt: Date.now(),
        })
      } else {
        raw.set(filename, {
          data: result,
          updatedAt: Date.now(),
        })
      }
    }
  }

  return {
    async style({ content, attributes, filename }): Promise<Processed> {
      if (!filename) return { code: content }

      //   // MARK: PREFLIGHTS
      //   if (OPTIONS.preflights === true && attributes['windi:preflights:global']) {
      //     const PREFLIGHTS = PROCESSOR.preflight()
      //     PREFLIGHTS_STYLE = globalStyleSheet(PREFLIGHTS).build()
      //   } else if (OPTIONS.preflights === true && attributes['windi:preflights']) {
      //     const PREFLIGHTS = PROCESSOR.preflight()
      //     PREFLIGHTS_STYLE = PREFLIGHTS.build()
      //   }
      let preflightStyleSheet = new StyleSheet()
      if (attributes['windi-preflights-global']) {
        preflightStyleSheet = globalStyleSheet(generatorWindi.preflight())
      }
      const preflightStyles = preflightStyleSheet.build()

      //   // MARK: SAFELIST
      //   if (OPTIONS.safeList && attributes['windi:safelist:global']) {
      //     const SAFELIST = PROCESSOR.interpret(OPTIONS.safeList).styleSheet
      //     SAFELIST_STYLE = globalStyleSheet(SAFELIST).build()
      //     if (OPTIONS.experimental && OPTIONS.experimental.icons != undefined) {
      //       let UNO_SAFELIST_STYLE = ''
      //       const { css } = await UNO.generate(OPTIONS.safeList)
      //       const UNO_SAFELIST_STYLESHEET = new CSSParser(css).parse()
      //       UNO_SAFELIST_STYLE = globalStyleSheet(UNO_SAFELIST_STYLESHEET).build()
      //       SAFELIST_STYLE += UNO_SAFELIST_STYLE
      //     }
      //   } else if (OPTIONS.safeList && attributes['windi:safelist']) {
      //     const SAFELIST = PROCESSOR.interpret(OPTIONS.safeList).styleSheet
      //     SAFELIST_STYLE = SAFELIST.build()
      //     if (OPTIONS.experimental && OPTIONS.experimental.icons != undefined) {
      //       let UNO_SAFELIST_STYLE = ''
      //       const { css } = await UNO.generate(OPTIONS.safeList)
      //       UNO_SAFELIST_STYLE = css
      //       SAFELIST_STYLE += UNO_SAFELIST_STYLE
      //     }
      //   }
      let safelistStyleSheet = new StyleSheet()
      if (attributes['windi-safelist-global']) {
        safelistStyleSheet = globalStyleSheet(
          generatorWindi.interpret(configuration.safeList || '').styleSheet
        )
      }
      const safelistStyles = safelistStyleSheet.build()

      let defaultStyles, attributifyStyles, iconStyles
      if (entryFileName.length > 0) {
        const result = await generateCSS(filename, attributes)
        defaultStyles = result.defaultStyles
        attributifyStyles = result.attributifyStyles
        iconStyles = result.iconStyles
      } else {
        entryFileName = filename
        const resultGlobal = await generateCSS('__GLOBAL', {
          'windi-inline-global': true,
        })
        defaultStyles = resultGlobal.defaultStyles
        attributifyStyles = resultGlobal.attributifyStyles
        iconStyles = resultGlobal.iconStyles
        const result = await generateCSS(filename, attributes)
        defaultStyles += result.defaultStyles
        attributifyStyles += result.attributifyStyles
        iconStyles += result.iconStyles
      }

      // MARK: CUSTOM CSS + WINDI @apply
      //   let CSS: StyleSheet
      //   CSS_SOURCE = content
      //   if (CSS_SOURCE && attributes['global']) {
      //     CSS = new CSSParser(CSS_SOURCE, PROCESSOR).parse()
      //     CSS_STYLE = globalStyleSheet(CSS).build()
      //   } else if (CSS_SOURCE) {
      //     const tmpCSS = CSS_SOURCE
      //     const rules = [...(tmpCSS.matchAll(/(?<selector>[^}]*){(?<css>[^}]*)}/gim) || [])]
      //     rules.forEach(rule => {
      //       if (rule.groups && rule.groups.selector.includes(':global')) {
      //         const globalCSS = new CSSParser(rule[0], PROCESSOR).parse()
      //         const buildGlobalCSS = globalStyleSheet(globalCSS).build()
      //         if (buildGlobalCSS.length > 0) CSS_STYLE += buildGlobalCSS + '\n'
      //       } else {
      //         CSS = new CSSParser(rule[0], PROCESSOR).parse()
      //         const buildLocalCSS = CSS.build()
      //         if (buildLocalCSS.length > 0) CSS_STYLE += buildLocalCSS + '\n'
      //       }
      //     })
      //   }
      const cssStyleSheet =
        new CSSParser(content, generatorWindi).parse() || new StyleSheet()

      let cssStyles = ''
      if (attributes['global']) {
        cssStyles = globalStyleSheet(cssStyleSheet).build()
      } else {
        cssStyles = cssStyleSheet.build()
      }

      //   // MARK: COMBINE
      //   let newStyleCode = '\n'
      //   if (PREFLIGHTS_STYLE.length > 0) newStyleCode += PREFLIGHTS_STYLE + '\n'
      //   if (SAFELIST_STYLE.length > 0) newStyleCode += SAFELIST_STYLE + '\n'
      //   if (CSS_STYLE.length > 0) newStyleCode += CSS_STYLE + '\n'
      //   if (INLINE_STYLE.length > 0) newStyleCode += INLINE_STYLE + '\n'
      //   if (UNO_STYLE.length > 0) newStyleCode += UNO_STYLE + '\n'
      let newCode = ''
      if (preflightStyles.length > 0) newCode += '\n' + preflightStyles
      if (safelistStyles.length > 0) newCode += '\n' + safelistStyles
      if (defaultStyles.length > 0) newCode += '\n' + defaultStyles
      if (attributifyStyles.length > 0) newCode += '\n' + attributifyStyles
      if (iconStyles.length > 0) newCode += '\n' + iconStyles
      if (cssStyles.length > 0) newCode += '\n' + cssStyles
      newCode += '\n'

      return {
        code: newCode,
      }
    },
  }
}

export interface BaseConfig {
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
  experimental?: {
    icons?: {
      prefix?: string
      collections?: Record<string, IconifyJSON>
      extraProperties?: Record<string, string>
    }
    scan?: boolean
  }
}
export type DefaultConfig = BaseConfig
export type UserConfig = BaseConfig

const defaultConfig: DefaultConfig = {
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

let configuration: BaseConfig
let generatorWindi: Processor
let generatorUno: UnoGenerator

// if (windiConfig != undefined) {
//   if (OPTIONS.configPath) {
//     // get modified time of config file
//     const mTime = statSync(OPTIONS.configPath).mtimeMs
//     if (mTime > configMTime) {
//       const tmpConfigPath = `./${Date.now()}windi.config.js`
//       copyFileSync(OPTIONS.configPath, tmpConfigPath)
//       loadConfig(tmpConfigPath)
//         .catch(e => {
//           useDebugger.createLog('Unknown Error while loading the config')
//           console.error(e)
//         })
//         .finally(() => {
//           rmSync(tmpConfigPath)
//           resolve({
//             code: _preprocess(content, filename),
//           })
//         })
//     } else {
//       resolve({
//         code: _preprocess(content, filename),
//       })
//     }
//   }
// } else {
//   if (OPTIONS.configPath) {
//     loadConfig(OPTIONS.configPath)
//       .catch(e => {
//         useDebugger.createLog('Unknown Error while loading the config')
//         console.error(e)
//       })
//       .finally(() => {
//         resolve({
//           code: _preprocess(content, filename),
//         })
//       })
//   } else {
//     PROCESSOR.loadConfig()
//     resolve({
//       code: _preprocess(content, filename),
//     })
//   }
// }

export function windi(userConfig: UserConfig = {}): PreprocessorGroup {
  configuration = { ...defaultConfig, ...userConfig }
  generatorWindi = new Processor()
  const steps: PreprocessorGroup[] = []
  if (configuration.experimental?.icons != undefined) {
    generatorUno = createGenerator(
      {
        presets: [
          UnocssIcons({
            ...configuration.experimental.icons,
          }),
        ],
      },
      {}
    )
  }

  if (configuration.experimental?.scan == undefined) {
    steps.push(agent())
  }
  steps.push(main())

  return {
    async markup({ content, filename }): Promise<Processed> {
      let code = content

      for (const step of steps) {
        code = (await preprocess(content, step, { filename })).code
      }

      return {
        code,
      }
    },
  }
}

export default windi
