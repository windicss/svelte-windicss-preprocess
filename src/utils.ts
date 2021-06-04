import { readFileSync } from 'fs'
import { performance } from 'perf_hooks'
import { format, RequiredOptions } from 'prettier'
import Processor from 'windicss'
import type { FullConfig } from 'windicss/types/interfaces'
import { StyleSheet } from 'windicss/utils/style'
import type { Options } from './index'

export function combineStyleList(stylesheets: StyleSheet[]): StyleSheet {
  return stylesheets
    .reduce((previousValue, currentValue) => previousValue.extend(currentValue), new StyleSheet())
    .combine()
}

export function globalStyleSheet(styleSheet: StyleSheet): StyleSheet {
  // turn all styles in stylesheet to global style
  styleSheet.children.forEach(style => {
    if (!style.rule.includes(':global') && style.meta.group !== 'keyframes') {
      style.wrapRule((rule: string) => `:global(${rule})`)
    }
    if (style.atRules && !style.atRules.includes('-global-') && style.meta.group == 'keyframes') {
      style.atRules[0] = style.atRules[0].replace(/(?<=keyframes )(?=\w)/gi, '-global-')
    }
  })
  return styleSheet
}

class Step {
  processor: Processor
  content: string
  filename: string
  windiClassList: string[] = []
  directiveClassList: string[] = []
  attributifyClassList: Map<string, string[]> = new Map()
  mainClassList: string[] = []
  constructor(processor: Processor, content: string, filename: string) {
    this.processor = processor
    this.content = content
    this.filename = filename
  }

  processWindiExpression() {

    const tmpContent = this.content
    const WINDI_MATCHES = [...tmpContent.matchAll(/windi`(.*?)`/gi)]
    if (WINDI_MATCHES.length < 1) return this
    for (const match of WINDI_MATCHES) {
      const cleanedMatch = match[1]
        .replace(/(?<![-])[$](?=[{])|(?<=([{][\w\s]+[^{]*?))['":]|([{][\w\s]+[^{]*?[?])|^[{]|(?<=["'`)])[}]/gi, ' ')
        .replace(/ {2,}/gi, ' ')
        .replace(/["'`]/gi, '')
      this.windiClassList = this.windiClassList.concat(cleanedMatch.split(' '))
    }

    this.content = tmpContent
    return this

  }

  processDirectiveClass() {

    const tmpContent = this.content
    const DIRECTIVE_CLASS_MATCHES = [...tmpContent.matchAll(/\s(class):([^=]+)(=)/gi)]
    if (DIRECTIVE_CLASS_MATCHES.length < 1) return this
    for (const match of DIRECTIVE_CLASS_MATCHES) {
      this.directiveClassList.push(match[2])
    }

    this.content = tmpContent
    return this
  }

  processAttributify() {

    // FIXME: #150 not bulletprof yet
    const tmpContent = this.content
    const ATTRIBUTIFY_CLASS_MATCHES = [...tmpContent.matchAll(/([\w+:_/-]+)=(['"])([!\w\s\n~:/\\,%#[\].$-]*?)\2/gi)]
    // TODO: allow prefix with ::
    // extract key & value as class array
    if (ATTRIBUTIFY_CLASS_MATCHES.length < 1) return this
    for (const match of ATTRIBUTIFY_CLASS_MATCHES) {
      if (match[1] == 'class') continue
      this.attributifyClassList.set(match[1].toString(), match[3].split(' '))
    }

    this.content = tmpContent
    return this
  }

  processClassAttribute() {

    const tmpContent = this.content
    const CLASS_MATCHES = [...tmpContent.matchAll(/(class)=(['"])([^\2]*?)\2/gi)]
    if (CLASS_MATCHES.length < 1) return this
    for (const match of CLASS_MATCHES) {
      const cleanedMatch = match[3]
        .replace(/windi[`].+?[`]|(?<![-])[$](?=[{])|(?<=([{][\w\s]+[^{]*?))['":]|([{][\w\s]+[^{]*?[?])|^[{]|(?<=["'`)])[}]/gi, ' ')
        .replace(/ {2,}/gi, ' ')
        .replace(/["'`]/gi, '')
      this.mainClassList = cleanedMatch.split(' ')
    }

    this.content = tmpContent
    return this
  }

  compute(compile = false) {

    return {
      line: this.content,
      expressions: this.windiClassList,
      directives: this.directiveClassList,
      attributifies: this.attributifyClassList,
      classes: this.mainClassList
    }
  }
}

interface CustomPrettierOptions extends Partial<RequiredOptions> {
  svelteSortOrder: string,
  svelteStrictMode: boolean
  svelteAllowShorthand: boolean,
  svelteBracketNewLine: boolean
  svelteIndentScriptAndStyle: boolean
}

export class Magician {
  processor: Processor
  content: string
  filename: string
  isBundled = false
  isCompiled = false
  lines: string[] = []
  expressions: string[] = []
  directives: string[] = []
  attributifies: Map<string, string[]> = new Map()
  classes: string[] = []
  stylesheets: StyleSheet[] = []
  config: FullConfig = {}
  stats: Map<Record<string, string>,Record<string, string|number>> = new Map()
  computedStyleSheet: StyleSheet = new StyleSheet()
  css = ''

  constructor(processor: Processor, content: string, filename: string, config: FullConfig = {}) {
    this.processor = processor
    this.content = content
    this.filename = filename
    this.config = config
  }

  getStats(): Map<Record<string, string>,Record<string, string|number>> {
    return this.stats
  }

  clean(): this {
    let tmpContent = this.content
    // FIXME: CodeQL CODE WARNING
    tmpContent = tmpContent.replace(/<!--[\s\S]*?-->/g, '')
    tmpContent = tmpContent.replace(/([!\w][\w:_/-]*?):\(([\w\s/-]*?)\)/gm, (_, groupOne: string, groupTwo: string) =>
      groupTwo
        .split(/\s/g)
        .map(cssClass => `${groupOne}:${cssClass}`)
        .join(' ')
    )

    this.content = tmpContent
    return this
  }

  format(): this {
    // TODO: better formatting.. no upstream fix of prettier-plugin expected soon
    // https://github.com/sveltejs/prettier-plugin-svelte/issues/214

    const start = performance.now()
    let tmpContent = this.content

    tmpContent = tmpContent.replace(/(?<=[<]{1}\w[^>]+)\n/gmi, ' ')

    const options: CustomPrettierOptions = {
      parser: 'svelte',
      plugins: ['prettier-plugin-svelte'],
      printWidth: 5000,
      tabWidth: 2,
      svelteSortOrder: 'options-scripts-markup-styles',
      svelteStrictMode: true,
      svelteAllowShorthand: false,
      svelteBracketNewLine: false,
      svelteIndentScriptAndStyle: false,
    }
    const formatedContent = format(tmpContent, options)

    this.content = formatedContent
    this.stats.set({file: this.filename, category: 'format'},{text: 'Format .svelte File by Prettier', time: (performance.now() - start).toFixed(2)})

    return this
  }

  setInject(): this {
    let tmpContent = this.content
    const styleMatch = tmpContent.match(/(?<openTag><style[^>]*?>)(?<content>[\s\S]*?)(?<closeTag><\/style>)/gi)

    if (styleMatch) {
      tmpContent = tmpContent.replace('<style', '<style windi:inject')
    } else {
      tmpContent += '\n<style windi:inject>\n</style>'
    }

    this.content = tmpContent
    return this
  }

  each(callbackfn: (line: Step) => {
    line: string,
    expressions: string[],
    directives: string[],
    attributifies: Map<string, string[]>,
    classes: string[]
  }): this {
    let tmpContent = this.content

    this.lines = tmpContent.split('\n')
    this.lines.forEach(el => {
      // let result
      const { line, expressions, directives, attributifies, classes } = callbackfn(new Step(this.processor, el, this.filename))
      el = line
      this.expressions = this.expressions.concat(expressions)
      this.directives = this.directives.concat(directives)
      attributifies.forEach((v, k) => {
        if (this.attributifies.has(k)) {
          const oldValue = this.attributifies.get(k)
          if (oldValue) {
            this.attributifies.set(k, oldValue.concat(v))
          }
        } else {
          this.attributifies.set(k, v)
        }
      })
      this.classes = this.classes.concat(classes)
      // this.stylesheets = this.stylesheets.concat(sheets)
    })
    this.attributifies.forEach((v, k) => {
      const unique = new Set(v)
      this.attributifies.set(k, Array.from(unique))
    })
    tmpContent = this.lines.join('\n')
    this.content = tmpContent

    return this
  }

  compute(): this {
    const tmpContent = this.content

    const windiSet = new Set(this.expressions)
    const INTERPRETED_WINDI = this.processor.interpret( Array.from(windiSet).join(' ')).styleSheet


    const directiveSet = new Set(this.directives)
    const INTERPRETED_DIRECTIVE = this.processor.interpret(Array.from(directiveSet).join(' ')).styleSheet
    const start = performance.now()
    const INTERPRETED_ATTRIBUTIFY = this.processor.attributify(Object.fromEntries(this.attributifies)).styleSheet
    this.stats.set({file: this.filename, category: 'attributify'},{text: 'Handle Attributify by Windi CSS', time: (performance.now() - start).toFixed(2)})

    const classSet = new Set(this.classes)
    // console.log(classSet)
    const start2 = performance.now()
    const INTERPRETED_MAIN = this.processor.interpret(Array.from(classSet).join(' ')).styleSheet
    this.stats.set({file: this.filename, category: 'classes'},{text: 'Handle usual Classes by Windi CSS', time: (performance.now() - start2).toFixed(2)})

    // windiexpression
    this.stylesheets.push(INTERPRETED_DIRECTIVE)
    this.stylesheets.push(INTERPRETED_ATTRIBUTIFY)
    this.stylesheets.push(INTERPRETED_WINDI)
    this.stylesheets.push(INTERPRETED_MAIN)
    const start3 = performance.now()
    this.computedStyleSheet = combineStyleList(this.stylesheets).sort()
    this.stats.set({file: this.filename, category: 'sort'},{text: 'Combine and sort Styles by Windi CSS', time: (performance.now() - start3).toFixed(2)})

    this.content = tmpContent
    return this
  }

  getCode(): string {
    return this.content
  }

  getComputed(): StyleSheet {
    return this.computedStyleSheet
  }

  getExtracted(): string {
    return this.css
  }

  getFilename(): string {
    return this.filename
  }
}
