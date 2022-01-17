import type { IconifyJSON } from '@iconify/types'
import type { UnoGenerator } from '@unocss/core'
import { createGenerator } from '@unocss/core'
import UnocssIcons from '@unocss/preset-icons'
import windicssPreset from '@unocss/preset-wind'
import { parse as CSSParser, walk as CSSWalker } from 'css-tree'
import MagicString from 'magic-string'
import { bgRed, white } from 'nanocolors'
import { preprocess } from 'svelte/compiler'
import type {
  PreprocessorGroup,
  Processed,
} from 'svelte/types/compiler/preprocess'
import { loadConfig } from 'unconfig'
import { FileHandler, SetObject } from './utils'

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

const styleMap = new Map<
  string,
  {
    data: SetObject
    updatedAt: number
    writtenAt?: number
  }
>([
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

function extractStyles(): PreprocessorGroup {
  // add logic for global scan
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
        data: fileStyles,
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

      const styleSet = new Set([
        ...(styleMap.get(filename)?.data.inlineClasses || new Set()),
        ...(styleMap.get(filename)?.data.inlineDirectives || new Set()),
        ...(styleMap.get(filename)?.data.inlineExpressions || new Set()),
      ])
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
