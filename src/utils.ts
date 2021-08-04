import Processor from 'windicss'
import type { FullConfig } from 'windicss/types/interfaces'
import { StyleSheet } from 'windicss/utils/style'

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

interface Computed {
  default: {
    success: string[]
    ignored: string[]
    styleSheet: StyleSheet
  }
  attributify: {
    success: string[]
    ignored: string[]
    styleSheet: StyleSheet
  }
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
  stats: Map<Record<string, string>, Record<string, string | number>> = new Map()
  computed: Computed | undefined = undefined
  computedStyleSheet: StyleSheet = new StyleSheet()
  css = ''

  constructor(processor: Processor, content: string, filename: string, config: FullConfig = {}) {
    this.processor = processor
    this.content = content
    this.filename = filename
    this.config = config
  }

  getStats(): Map<Record<string, string>, Record<string, string | number>> {
    return this.stats
  }

  prepare(): this {
    let tmpContent = this.content
    // TODO: refactor so that preprocessor persists comments
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

  processClassAttribute(): this {
    const tmpContent = this.content
    const CLASS_MATCHES = [...tmpContent.matchAll(/(class)=(['"])(?<classes>[^\2]*?)\2/gi)]
    if (CLASS_MATCHES.length < 1) return this
    for (const match of CLASS_MATCHES) {
      const cleanedMatch = match[3]
        .replace(
          /windi[`].+?[`]|(?<![-])[$](?=[{])|(?<=([{][\w\s]+[^{]*?))['"]|(?<=([{][\w\s]+[^{]*?))\s[:]|([{][\w\s]+[^{]*?[?])|^[{]|(?<=["'`)])[}]/gi,
          ' '
        )
        .replace(/\n/gi, ' ')
        .replace(/ {2,}/gi, ' ')
        .replace(/["'`]/gi, '')
      this.classes = this.classes.concat(
        cleanedMatch.split(' ').filter(c => {
          return c.length > 0
        })
      )
    }
    //console.log(this.classes)

    this.content = tmpContent
    return this
  }

  processDirectiveClass(): this {
    const tmpContent = this.content
    const DIRECTIVE_CLASS_MATCHES = [...tmpContent.matchAll(/\s(class):(?<class>[^=]+)(=)/gi)]
    if (DIRECTIVE_CLASS_MATCHES.length < 1) return this
    for (const match of DIRECTIVE_CLASS_MATCHES) {
      this.directives = this.directives.concat(match[2])
      // this.directiveClassList.push(match[2])
    }
    //console.log(this.directives)
    this.content = tmpContent
    return this
  }

  processWindiExpression(): this {
    const tmpContent = this.content
    const WINDI_MATCHES = [...tmpContent.matchAll(/windi`(?<class>.*?)`/gi)]
    if (WINDI_MATCHES.length < 1) return this
    for (const match of WINDI_MATCHES) {
      const cleanedMatch = match[1]
        .replace(/(?<![-])[$](?=[{])|(?<=([{][\w\s]+[^{]*?))['":]|([{][\w\s]+[^{]*?[?])|^[{]|(?<=["'`)])[}]/gi, ' ')
        .replace(/ {2,}/gi, ' ')
        .replace(/["'`]/gi, '')
      this.expressions = this.expressions.concat(cleanedMatch.split(' '))
      // this.windiClassList = this.windiClassList.concat(cleanedMatch.split(' '))
    }
    //console.log(this.expressions)
    this.content = tmpContent
    return this
  }

  processAttributify(): this {
    // FIXME: #150 not bulletprof yet
    const tmpContent = this.content
    const ATTRIBUTIFY_CLASS_MATCHES = [...tmpContent.matchAll(/([\w+:_/-]+)=(['"])(?<classes>[^\2]*?)\2/gi)]
    // TODO: allow prefix with ::
    // extract key & value as class array
    if (ATTRIBUTIFY_CLASS_MATCHES.length < 1) return this
    for (const match of ATTRIBUTIFY_CLASS_MATCHES) {
      if (match[1] == 'class') continue
      if (match[1] == 'href') continue
      if (match[1] == 'this') continue
      if (match[1] == 'name') continue
      if (match[1] == 'stroke') continue
      if (match[1] == 'd') continue
      if (match[1] == 'slot') continue
      if (match[1] == 'viewBox') continue
      if (match[1] == 'points') continue
      if (match[1] == 'label') continue
      if (match[1].startsWith('class:')) continue
      const cleanedMatch = match[3]
        .replace(
          /windi[`].+?[`]|(?<![-])[$](?=[{])|(?<=([{][\w\s]+[^{]*?))['"]|(?<=([{][\w\s]+[^{]*?))\s[:]|([{][\w\s]+[^{]*?[?])|^[{]|(?<=["'`)])[}]/gi,
          ' '
        )
        .replace(/ {2,}/gi, ' ')
        .replace(/["'`]/gi, '')
      // this.attributifyClassList.set(match[1].toString(), cleanedMatch.split(' '))

      if (this.attributifies.has(match[1].toString())) {
        const oldValue = this.attributifies.get(match[1].toString())
        if (oldValue) {
          this.attributifies.set(match[1].toString(), oldValue.concat(cleanedMatch.split(' ')))
        }
      } else {
        this.attributifies.set(match[1].toString(), cleanedMatch.split(' '))
      }
    }
    //console.log(this.attributifies)

    this.content = tmpContent
    return this
  }

  compute(): this {
    const tmpContent = this.content

    const defaultSet = new Set(this.classes.concat(this.directives).concat(this.expressions))
    const INTERPRETED_DEFAULT = this.processor.interpret(Array.from(defaultSet).join(' '))

    this.attributifies.forEach((v, k) => {
      const unique = new Set(v)
      this.attributifies.set(k, Array.from(unique))
    })
    const INTERPRETED_ATTRIBUTIFY = this.processor.attributify(Object.fromEntries(this.attributifies))

    this.stylesheets.push(INTERPRETED_DEFAULT.styleSheet)
    this.stylesheets.push(INTERPRETED_ATTRIBUTIFY.styleSheet)
    this.computed = { default: INTERPRETED_DEFAULT, attributify: INTERPRETED_ATTRIBUTIFY }
    this.computedStyleSheet = combineStyleList(this.stylesheets).sort()

    this.content = tmpContent
    return this
  }

  getCode(): string {
    return this.content
  }

  getComputed(): Computed | undefined {
    return this.computed
  }
  getComputedStyleSheet(): StyleSheet {
    return this.computedStyleSheet
  }

  getExtracted(): string {
    return this.css
  }

  getFilename(): string {
    return this.filename
  }
}
