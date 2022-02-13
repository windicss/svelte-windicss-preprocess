import type { IconifyJSON } from '@iconify/types'
import type { UnoGenerator } from '@unocss/core'
import { createGenerator } from '@unocss/core'
import UnocssIcons from '@unocss/preset-icons'
import { presetTypography } from '@unocss/preset-typography'
import windicssPreset from '@unocss/preset-wind'
import { parse as CSSParser, walk as CSSWalker } from 'css-tree'
import fg from 'fast-glob'
import { readFileSync } from 'fs'
import MagicString from 'magic-string'
import { parse, preprocess } from 'svelte/compiler'
import type {
  PreprocessorGroup,
  Processed,
} from 'svelte/types/compiler/preprocess'
import { loadConfig } from 'unconfig'
import { type FullConfig } from 'windicss/types/interfaces'

export interface BaseConfig {
  silent?: boolean
  mode?: 'development' | 'production'
  icons?: {
    prefix?: string
    collections?: Record<string, IconifyJSON>
    extraProperties?: Record<string, string>
  }
}
export type DefaultConfig = BaseConfig
export type UserConfig = BaseConfig
let initialFileName = ''

const defaults: DefaultConfig = {}
let generatorConfiguration: BaseConfig
let windiConfiguration: any
let windiGenerator: UnoGenerator
let iconGenerator: UnoGenerator

const styles: {
  [key: string]: Set<string>
} = {
  __GLOBAL__: new Set(),
}

function splitVariantGroups(content: string) {
  return content.replace(
    /([!\w][\w:_/-]*?):\(([\w\s/-]*?)\)/gm,
    (_, groupOne: string, groupTwo: string) =>
      groupTwo
        .split(/\s/g)
        .map(cssClass => `${groupOne}:${cssClass}`)
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
  }
  return content
}

function cleanUtilities(utilities: string) {
  return utilities
    .replace(/windi[`].+?[`]/gi, ' ') // windi`XYZ`
    .replace(/(?<![-])[$](?=[{])/gi, ' ') // if leading char is not -, and next char is {, then remove $
    .replace(/(?<=([{][\w\s]+[^{]*?))['"]/gi, ' ') // remove quotes in curly braces
    .replace(/(?<=([{][\w\s]+[^{]*?)\s)[:]/gi, ' ') // remove : in curly braces
    .replace(/([{][\w\s]+[^{]*?[?])/gi, ' ') // remove ? and condition in curly braces
    .replace(/[{}]/gi, ' ') // remove curly braces
    .replace(/\n/gi, ' ') // remove newline
    .replace(/ {2,}/gi, ' ') // remove multiple spaces
    .replace(/["'`]/gi, '') // remove quotes
    .trim()
    .split(' ')
}

function scanFile(content: string, filename: string) {
  //TODO@alexanderniebuhr add attributifies
  const MATCHES = [
    ...content.matchAll(/class=(['"`])(?<utilities>[^\1]+?)\1/gi),
    ...content.matchAll(/class=(?<utilities>[{][^}]+?)}/gi),
    ...content.matchAll(/\s(class):(?<utility>[^=]+)(=)/gi),
  ]
  styles[filename] = new Set()

  for (const match of MATCHES) {
    if (match.groups?.utility && match.groups.utility.startsWith('global:')) {
      styles['__GLOBAL__'].add(match.groups.utility.replace('global:', ''))
    } else if (match.groups?.utility) {
      styles[filename].add(match.groups.utility)
    }
    if (match.groups?.utilities) {
      cleanUtilities(match.groups?.utilities).forEach(utility => {
        if (utility.startsWith('global:')) {
          styles['__GLOBAL__'].add(utility.replace('global:', ''))
        } else {
          styles[filename].add(utility)
        }
      })
    }
  }

  return styles
}

function extractStyles(): PreprocessorGroup {
  if (initialFileName.length == 0) {
    const filePaths = fg.sync(['src/**/*.svelte'], {})
    for (const filepath of filePaths) {
      const content = splitVariantGroups(readFileSync(filepath).toString())
      scanFile(content, filepath)
    }
  }

  return {
    async markup({ content, filename }): Promise<Processed> {
      if (!filename) return { code: content }
      if (initialFileName.length == 0) initialFileName = filename
      content = addStyleTag(content)
      content = content.replace(/global:/gi, '')
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
          node.prelude.children.forEach(identifier => {
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

          CSSWalker(applyStyleSheet, (node, item, list) => {
            if (node.type == 'Declaration') {
              if (node.value.type == 'Raw') {
                generatedApplyCss += `${node.property}:${node.value.value};`
              }
            }
          })

          tagStylesCSS.overwrite(
            node.loc.start.offset,
            node.loc.end.offset,
            generatedApplyCss
          )
          content = tagStylesCSS.toString()
        }
      })

      let globalContent
      if (initialFileName == filename) {
        // generate global styles
        const globalStyles = await windiGenerator.generate(styles['__GLOBAL__'])
        const globalStylesCSS = new MagicString(
          `
            *,
            ::before,
            ::after {
              box-sizing: border-box; /* 1 */
              border-width: 0; /* 2 */
              border-style: solid; /* 2 */
              border-color: currentColor; /* 2 */
            }

            html {
              line-height: 1.5; /* 1 */
              -webkit-text-size-adjust: 100%; /* 2 */
              -moz-tab-size: 4; /* 3 */
              tab-size: 4; /* 3 */
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; /* 4 */
            }

            body {
              margin: 0; /* 1 */
              line-height: inherit; /* 2 */
            }

            hr {
              height: 0; /* 1 */
              color: inherit; /* 2 */
              border-top-width: 1px; /* 3 */
            }

            abbr:where([title]) {
              text-decoration: underline dotted;
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
              font-size: inherit;
              font-weight: inherit;
            }

            a {
              color: inherit;
              text-decoration: inherit;
            }

            b,
            strong {
              font-weight: bolder;
            }

            code,
            kbd,
            samp,
            pre {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; /* 1 */
              font-size: 1em; /* 2 */
            }

            small {
              font-size: 80%;
            }

            sub,
            sup {
              font-size: 75%;
              line-height: 0;
              position: relative;
              vertical-align: baseline;
            }

            sub {
              bottom: -0.25em;
            }

            sup {
              top: -0.5em;
            }

            table {
              text-indent: 0; /* 1 */
              border-color: inherit; /* 2 */
              border-collapse: collapse; /* 3 */
            }

            button,
            input,
            optgroup,
            select,
            textarea {
              font-family: inherit; /* 1 */
              font-size: 100%; /* 1 */
              line-height: inherit; /* 1 */
              color: inherit; /* 1 */
              margin: 0; /* 2 */
              padding: 0; /* 3 */
            }

            button,
            select {
              text-transform: none;
            }

            button,
            [type='button'],
            [type='reset'],
            [type='submit'] {
              -webkit-appearance: button; /* 1 */
              background-color: transparent; /* 2 */
              background-image: none; /* 2 */
            }

            :-moz-focusring {
              outline: auto;
            }

            :-moz-ui-invalid {
              box-shadow: none;
            }

            progress {
              vertical-align: baseline;
            }

            ::-webkit-inner-spin-button,
            ::-webkit-outer-spin-button {
              height: auto;
            }

            [type='search'] {
              -webkit-appearance: textfield; /* 1 */
              outline-offset: -2px; /* 2 */
            }

            ::-webkit-search-decoration {
              -webkit-appearance: none;
            }

            ::-webkit-file-upload-button {
              -webkit-appearance: button; /* 1 */
              font: inherit; /* 2 */
            }

            summary {
              display: list-item;
            }

            blockquote,
            dl,
            dd,
            h1,
            h2,
            h3,
            h4,
            h5,
            h6,
            hr,
            figure,
            p,
            pre {
              margin: 0;
            }

            fieldset {
              margin: 0;
              padding: 0;
            }

            legend {
              padding: 0;
            }

            ol,
            ul,
            menu {
              list-style: none;
              margin: 0;
              padding: 0;
            }

            textarea {
              resize: vertical;
            }

            input::placeholder,
            textarea::placeholder {
              opacity: 1; /* 1 */
              color: #9ca3af; /* 2 */
            }

            button,
            [role="button"] {
              cursor: pointer;
            }

            :disabled {
              cursor: default;
            }

            img,
            svg,
            video,
            canvas,
            audio,
            iframe,
            embed,
            object {
              display: block; /* 1 */
              vertical-align: middle; /* 2 */
            }

            img,
            video {
              max-width: 100%;
              height: auto;
            }

            [hidden] {
              display: none;
            }
            ` + globalStyles.css
        )
        const globalStyleSheet = CSSParser(globalStylesCSS.toString(), {
          positions: true,
          parseValue: false,
        })

        CSSWalker(globalStyleSheet, (node, item, list) => {
          if (
            node.type === 'Rule' &&
            node.prelude.type === 'SelectorList' &&
            node.prelude.loc
          ) {
            globalStylesCSS
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
            globalStylesCSS.appendLeft(
              node.prelude.loc?.start.offset,
              '-global-'
            )
            return (CSSWalker as any).skip
          }
        })
        globalContent = globalStylesCSS.toString()
      }
      const windiStyles = await windiGenerator.generate(styles[filename])
      const windiStylesCSS = new MagicString(windiStyles.css)
      const newContent =
        (globalContent ? globalContent : '') +
        '\n' +
        windiStylesCSS.toString() +
        '\n' +
        content
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

  const presets = [windicssPreset(), presetTypography()]
  if (generatorConfiguration.icons != undefined) {
    presets.push(
      UnocssIcons({
        ...generatorConfiguration.icons,
      })
    )
  }

  windiGenerator = createGenerator(
    {},
    {
      presets,
    }
  )

  return {
    async markup({ content, filename }): Promise<Processed> {
      if (!windiConfiguration) {
        const { config } = await loadConfig<FullConfig>({
          merge: false,
          sources: [
            {
              files: 'windi.config',
              extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json'],
            },
          ],
        })
        // console.log(config)

        // windiGenerator.setConfig({
        //   theme: config.theme,
        //   safelist: [''],
        //   // preprocess: config.preprocess,
        // })
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
