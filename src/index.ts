import { type IconifyJSON } from '@iconify/types'
import { createGenerator, type UnoGenerator } from '@unocss/core'
import presetIcons from '@unocss/preset-icons'
import { presetTypography } from '@unocss/preset-typography'
import presetAttributify from '@unocss/preset-attributify'
import presetWindi from '@unocss/preset-wind'
import { parse as CSSParser, walk as CSSWalker } from 'css-tree'
import fg from 'fast-glob'
import MagicString from 'magic-string'
import { readFileSync } from 'node:fs'
import { parse, preprocess } from 'svelte/compiler'
import { type PreprocessorGroup, type Processed } from 'svelte/types/compiler/preprocess'
import { loadConfig } from 'unconfig'
import { type FullConfig } from 'windicss/types/interfaces'

export interface BaseConfig {
  silent?: boolean
  mode?: 'development' | 'production'
  attributify?: {
    strict?: boolean
    prefix?: string
    prefixedOnly?: boolean
    nonValuedAttribute?: boolean
    ignoreAttributes?: string[]
  }
  typography?: any
  icons?: {
    prefix?: string
    collections?: Record<string, IconifyJSON>
    extraProperties?: Record<string, string>,
    cdn?: string
  }
}
export type DefaultConfig = BaseConfig
export type UserConfig = BaseConfig
let initialFileName = ''

const defaults: DefaultConfig = {}
let generatorConfiguration: BaseConfig
let windiConfiguration: any
let windiGenerator: UnoGenerator

const styles: {
  [key: string]: Set<string>
} = {
  __GLOBAL__: new Set(),
}

function splitVariantGroups(content: string) {
  return content.replace(/(\w+):\(([\s\w/<:!-]+)\)/g, (_, groupOne: string, groupTwo: string) =>
    groupTwo
      .split(/\s/g)
      .map((cssClass) => `${groupOne}:${cssClass}`)
      .join(' ')
  )
}

function addStyleTag(content: string) {
  const ast = parse(content, {})
  if (!ast.css) {
    // no style tag, create a new one
    content += '\n<style>\n</style>\n'
  } else if (ast && ast.css.content.start == ast.css.content.end) {
    // empty style tag, replace with a new one
    content = content.replace('<style></style>', '<style>\n</style>')
  } else {
    // non-empty style tag, add styles to it
  }

  return content
}

function cleanUtilities(utilities: string) {
  return utilities
    .replace(/windi`.+?`/gi, ' ') // windi`XYZ`
    .replace(/(?<!-)\$(?=\{)/g, ' ') // if leading char is not -, and next char is {, then remove $
    .replace(/(?<=(\{[\s\w][^{]*?))["']/g, ' ') // remove quotes in curly braces
    .replace(/(?<=(\{[\s\w][^{]*?)\s):/g, ' ') // remove : in curly braces
    .replace(/(\{[\s\w][^{]*?\?)/g, ' ') // remove ? and condition in curly braces
    .replace(/[{}]/g, ' ') // remove curly braces
    .replace(/\n/g, ' ') // remove newline
    .replace(/ {2,}/g, ' ') // remove multiple spaces
    .replace(/["'`]/g, '') // remove quotes
    .trim()
    .split(' ')
}

function scanFile(content: string, filename: string) {
  //TODO@alexanderniebuhr add attributifies
  const MATCHES = [
    ...content.matchAll(/\s(class):(?<utility>[^=]+)(=)/gi),
    ...content.matchAll(/class=(["'`])(?<utilities>[^\1]+?)\1/gi),
    ...content.matchAll(/class=(?<utilities>\{[^}]+)\}/gi),
  ]
  styles[filename] = new Set()
  for (const match of MATCHES) {
    if (match.groups?.utility) {
      styles[filename].add(match.groups.utility)
    }
    if (match.groups?.utilities) {
      for (const utility of cleanUtilities(match.groups?.utilities)) {
        styles[filename].add(utility)
      }
    }
  }
}

function extractStyles(): PreprocessorGroup {
  return {
    async markup({ content, filename }): Promise<Processed> {
      if (!filename) return { code: content }
      console.log(filename)
      content = splitVariantGroups(content)
      scanFile(content, filename)
      content = addStyleTag(content)
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
      // get currentStyles
      const tagStylesCSS = new MagicString(content)
      const tagStyleSheet = CSSParser(tagStylesCSS.toString(), {
        positions: true,
        parseValue: false,
      })

      CSSWalker(tagStyleSheet, async (node, item, list) => {
        if (
          node.type === 'Atrule' &&
          node.loc &&
          node.prelude &&
          node.prelude.type === 'AtrulePrelude' &&
          node.prelude.children
        ) {
          const applyUtillities: Set<string> = new Set()
          // eslint-disable-next-line unicorn/no-array-for-each
          node.prelude.children.forEach((identifier) => {
            if (identifier.type === 'Identifier') {
              applyUtillities.add(identifier.name)
            }
          })

          let generatedApplyCss = ''
          const applyStyles = await windiGenerator.generate(applyUtillities)
          const applyStylesCSS = new MagicString(applyStyles.css)
          const applyStyleSheet = CSSParser(applyStylesCSS.toString(), {
            positions: true,
            parseValue: false,
          })

          CSSWalker(applyStyleSheet, (node) => {
            if (node.type == 'Declaration' && node.value.type == 'Raw') {
              generatedApplyCss += `${node.property}:${node.value.value};`
            }
          })

          tagStylesCSS.overwrite(node.loc.start.offset, node.loc.end.offset, generatedApplyCss)
          content = tagStylesCSS.toString()
        }
      })

      const windiStyles = await windiGenerator.generate(styles[filename])
      console.log(styles[filename])
      console.log(windiStyles)
      const windiStylesCSS = new MagicString(windiStyles.css)
      const newContent =  windiStylesCSS.toString() + '\n' + content
      // console.log(newContent)
      return {
        code: newContent,
        // code: '',
      }
    },
  }
}

export function generate(userConfig: UserConfig = {}): PreprocessorGroup {
  generatorConfiguration = { ...defaults, ...userConfig }

  const presets = []
  if (generatorConfiguration.attributify != undefined) {
    presets.push(
      presetAttributify({
        ...generatorConfiguration.attributify,
      })
    )
  }
  presets.push(presetWindi())
  if (generatorConfiguration.typography != undefined) {
    presets.push(
      presetTypography({
        ...generatorConfiguration.typography,
      })
    )
  }
  if (generatorConfiguration.icons != undefined) {
    presets.push(
      presetIcons({
        ...generatorConfiguration.icons,
      })
    )
  }

  console.log(
    'activated presets',
    presets.map((p) => p.name)
  )
  windiGenerator = createGenerator(
    {},
    {
      presets: presets,
    }
  )

  return {
    async markup({ content, filename }): Promise<Processed> {
      if (filename && initialFileName.length === 0) initialFileName = filename
      const { config } = await loadConfig<FullConfig>({
        merge: false,
        sources: [
          {
            files: 'windi.config',
            extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json'],
          },
        ],
      })
      if (config !== undefined) {
        windiGenerator.setConfig({
          theme: config.theme,
        })
        windiConfiguration = config
      }

      let output = content
      const generatorSteps = [
        extractStyles(),
        generateCSS()
      ]

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
