import type { IconifyJSON } from '@iconify/types'
import type { UnoGenerator } from '@unocss/core'
import { createGenerator } from '@unocss/core'
import UnocssIcons from '@unocss/preset-icons'
import windicssPreset from '@unocss/preset-wind'
import { parse as CSSParser, walk as CSSWalker } from 'css-tree'
import fg from 'fast-glob'
import { readFileSync } from 'fs'
import MagicString from 'magic-string'
import { bgRed, white } from 'nanocolors'
import { parse, preprocess } from 'svelte/compiler'
import type {
  PreprocessorGroup,
  Processed,
} from 'svelte/types/compiler/preprocess'
import { loadConfig } from 'unconfig'
import { FileHandler } from './utils'

export interface BaseConfig {
  silent?: boolean
  mode?: 'development' | 'production'
  experimental?: {
    icons?: {
      prefix?: string
      collections?: Record<string, IconifyJSON>
      extraProperties?: Record<string, string>
    }
    scan?: boolean
    engineVersion?: string
  }
}
export type DefaultConfig = BaseConfig
export type UserConfig = BaseConfig

const defaults: DefaultConfig = {}
let generatorConfiguration: BaseConfig
let windiConfiguration: any
let windiGenerator: UnoGenerator
let iconGenerator: UnoGenerator

const styleMap = new Map<string, any>([
  [
    '__GLOBAL__',
    {
      data: {
        inline: {
          utilities: new Set(),
          attributifies: new Map(),
          icons: new Set(),
        },
        styles: {
          utilities: new Set(),
          icons: new Set(),
        },
      },
      updatedAt: Date.now(),
    },
  ],
])

function extractStyles(): PreprocessorGroup {
  // MARK: experiment global on entry
  if (generatorConfiguration.experimental?.scan) {
    const filePaths = fg.sync(['src/**/*.svelte'], {})
    for (const filepath of filePaths) {
      const content = readFileSync(filepath).toString()
      const ast = parse(content, { filename: filepath })
      const hasGlobalInline = ast.css.attributes.some(
        el => el.name == 'windi-inline-global'
      )

      const result = new FileHandler(content).prepare().scan().getStyles()
      const globalStyles = styleMap.get('__GLOBAL__')
      if (globalStyles && hasGlobalInline) {
        styleMap.set('__GLOBAL__', {
          data: {
            inline: {
              utilities: new Set([
                ...globalStyles.data.inline.utilities,
                ...result.data.inline.utilities,
              ]),
              attributifies: new Map([
                ...globalStyles.data.inline.attributifies,
                ...result.data.inline.attributifies,
              ]),
              icons: new Map([
                ...globalStyles.data.inline.icons,
                ...result.data.inline.icons,
              ]),
            },
          },
          updatedAt: Date.now(),
        })
        styleMap.set(filepath, {
          data: {
            inline: null,
          },
          updatedAt: Date.now(),
        })
      } else {
        styleMap.set(filepath, {
          data: result,
          updatedAt: Date.now(),
        })
      }
    }
  }

  return {
    async markup({ content, filename }): Promise<Processed> {
      if (!filename) return { code: content }
      console.log('extract: MARKUP', filename)
      const fileStyles = new FileHandler(content)
        .clean()
        .prepare()
        .scan()
        .getStyles()

      styleMap.set(filename, {
        data: fileStyles.data,
        updatedAt: Date.now(),
      })
      return {
        code: content,
      }
    },
  }
}

function generateCSS(): PreprocessorGroup {
  return {
    async style({ content, attributes, filename }): Promise<Processed> {
      if (!filename) return { code: content }
      console.log('generate: Style', filename)

      const styleSet = styleMap.get(filename)?.data.inline.utilities
      const windiStyles = await windiGenerator.generate(styleSet)
      const windiStylesCSS = new MagicString(windiStyles.css)
      const windiStyleSheet = CSSParser(windiStylesCSS.toString(), {
        positions: true,
        parseValue: false,
      })

      CSSWalker(windiStyleSheet, (node, item, list) => {
        if (
          node.type === 'Rule' &&
          node.prelude.type === 'SelectorList' &&
          node.prelude.loc
        ) {
          windiStylesCSS
            .appendLeft(node.prelude.loc?.start.offset, ':global(')
            .appendRight(node.prelude.loc?.end.offset, ')')
        }

        if (
          node.type === 'Atrule' &&
          node.name === 'keyframes' &&
          node.prelude &&
          node.prelude.type === 'AtrulePrelude' &&
          node.prelude.loc
        ) {
          windiStylesCSS.appendLeft(node.prelude.loc?.start.offset, '-global-')
          return (CSSWalker as any).skip
        }
      })

      return {
        code: windiStylesCSS.toString(),
      }
    },
  }
}

export function generate(userConfig: UserConfig = {}): PreprocessorGroup {
  generatorConfiguration = { ...defaults, ...userConfig }

  if (generatorConfiguration.experimental?.engineVersion != 'v4') {
    console.log(
      bgRed(white('[ERROR]')),
      'Caution, you did not enable experimental support to use this release'
    )
    process.exit(1)
  }

  windiGenerator = createGenerator({}, { presets: [windicssPreset()] })

  if (generatorConfiguration.experimental?.icons != undefined) {
    iconGenerator = createGenerator(
      {
        presets: [
          UnocssIcons({
            ...generatorConfiguration.experimental.icons,
          }),
        ],
      },
      {}
    )
  }

  return {
    async markup({ content, filename }): Promise<Processed> {
      if (!windiConfiguration) {
        const { config } = await loadConfig<any>({
          merge: false,
          sources: [
            {
              files: 'windi.config',
              extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json'],
            },
          ],
        })
        windiGenerator.setConfig(config)
        windiConfiguration = config
      }

      let output = content
      const generatorSteps = [extractStyles(), generateCSS()]

      for (const generatorStep of generatorSteps) {
        const { code } = await preprocess(output, generatorStep, { filename })
        output = code
      }

      return {
        code: output,
      }
    },
  }
}

export const windi = generate
export default windi
