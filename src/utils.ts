import { parse } from 'svelte/compiler'

export class FileHandler {
  private content: string
  utilities: string[] = []
  attributifies: Map<string, string[]> = new Map()
  icons: string[] = []

  constructor(content: string) {
    console.log('CONSTRUCT')
    this.content = content
  }

  public clean(): this {
    console.log('FILE-STEP: CLEAN')
    // find a way around this
    this.content = this.content.replace(/<!--[\s\S]*?-->/g, '')

    return this
  }

  public prepare(): this {
    console.log('FILE-STEP: PREPARE')
    this.content = this.content.replace(
      /([!\w][\w:_/-]*?):\(([\w\s/-]*?)\)/gm,
      (_, groupOne: string, groupTwo: string) =>
        groupTwo
          .split(/\s/g)
          .map(cssClass => `${groupOne}:${cssClass}`)
          .join(' ')
    )

    const ast = parse(this.content, {})
    if (!ast.css) {
      // no style tag found, so have to set one
      this.content += '\n<style>\n</style>\n'
    } else if (ast && ast.css.content.start == ast.css.content.end) {
      // style tag without content, so have to set one
      this.content = this.content.replace(
        '<style></style>',
        '<style>\n</style>'
      )
    }

    return this
  }

  private cleanUtility(dirtyClasses: string): string {
    return dirtyClasses
      .replaceAll(/windi[`].+?[`]/gi, ' ') // windi`XYZ`
      .replaceAll(/(?<![-])[$](?=[{])/gi, ' ') // if leading char is not -, and next char is {, then remove $
      .replaceAll(/(?<=([{][\w\s]+[^{]*?))['"]/gi, ' ') // remove quotes in curly braces
      .replaceAll(/(?<=([{][\w\s]+[^{]*?)\s)[:]/gi, ' ') // remove : in curly braces
      .replaceAll(/([{][\w\s]+[^{]*?[?])/gi, ' ') // remove ? and condition in curly braces
      .replaceAll(/[{}]/gi, ' ') // remove curly braces
      .replaceAll(/\n/gi, ' ') // remove newline
      .replaceAll(/ {2,}/gi, ' ') // remove multiple spaces
      .replaceAll(/["'`]/gi, '') // remove quotes
  }

  public scan(): this {
    console.log('FILE-STEP: SCAN')

    const CLASSATTRIBUTE_MATCHES = [
      ...this.content.matchAll(/class=(['"`])(?<utilities>[^\1]+?)\1/gi),
      ...this.content.matchAll(/class=(?<utilities>[{][^}]+?)}/gi),
    ]

    for (const match of CLASSATTRIBUTE_MATCHES) {
      const cleanedMatch = this.cleanUtility(match.groups?.utilities || '')
      this.utilities = this.utilities.concat(
        cleanedMatch.split(' ').filter(c => {
          if (c.startsWith('i-')) return false
          return c.length > 0
        })
      )
      this.icons = this.icons.concat(
        cleanedMatch.split(' ').filter(c => {
          if (!c.startsWith('i-')) return false
          return c.length > 0
        })
      )
    }

    const DIRECTIVE_MATCHES = [
      ...this.content.matchAll(/\s(class):(?<utility>[^=]+)(=)/gi),
    ]
    for (const match of DIRECTIVE_MATCHES) {
      if (match.groups?.utility.startsWith('i-')) {
        this.icons = this.icons.concat(match.groups?.utility)
      } else if (match.groups?.utility) {
        this.utilities = this.utilities.concat(match.groups?.utility)
      }
    }

    console.log('utility', this.utilities)
    console.log('icons', this.icons)

    // this.processWindiExpression()
    // this.processAttributify()

    return this
  }

  // processWindiExpression(): this {
  //   const tmpContent = this.content
  //   const WINDI_MATCHES = [...tmpContent.matchAll(/windi`(?<class>.*?)`/gi)]
  //   if (WINDI_MATCHES.length < 1) return this
  //   for (const match of WINDI_MATCHES) {
  //     const cleanedMatch = match[1]
  //       .replace(
  //         /(?<![-])[$](?=[{])|(?<=([{][\w\s]+[^{]*?))['":]|([{][\w\s]+[^{]*?[?])|^[{]|(?<=["'`)])[}]/gi,
  //         ' '
  //       )
  //       .replace(/ {2,}/gi, ' ')
  //       .replace(/["'`]/gi, '')
  //     this.expressions = this.expressions.concat(cleanedMatch.split(' '))
  //     // this.windiClassList = this.windiClassList.concat(cleanedMatch.split(' '))
  //   }
  //   this.content = tmpContent
  //   return this
  // }

  // processAttributify(): this {
  //   const ATTRIBUTIFY_CLASS_MATCHES = [
  //     ...this.content.matchAll(/([\w+:_/-]+)=(['"`])(?<classes>[^\2]+?)\2/gi),
  //   ]

  //   if (ATTRIBUTIFY_CLASS_MATCHES.length < 1) return this
  //   for (const match of ATTRIBUTIFY_CLASS_MATCHES) {
  //     if (match[1] == 'class') continue
  //     if (match[1] == 'href') continue
  //     if (match[1] == 'for') continue
  //     // if (match[1] == 'this') continue
  //     // if (match[1] == 'name') continue
  //     // if (match[1] == 'stroke') continue
  //     // if (match[1] == 'd') continue
  //     // if (match[1] == 'slot') continue
  //     // if (match[1] == 'viewBox') continue
  //     // if (match[1] == 'points') continue
  //     // if (match[1] == 'label') continue
  //     // if (match[1] == 'xmlns') continue
  //     if (match[1].startsWith('class:')) continue
  //     const cleanedMatch = match[3]
  //       .replace(
  //         /windi[`].+?[`]|(?<![-])[$](?=[{])|(?<=([{][\w\s]+[^{]*?))['"]|(?<=([{][\w\s]+[^{]*?))\s[:]|([{][\w\s]+[^{]*?[?])|^[{]|(?<=["'`)])[}]/gi,
  //         ' '
  //       )
  //       .replace(/ {2,}/gi, ' ')
  //       .replace(/["'`]/gi, '')
  //       .replace(/\n/gi, ' ')

  //     if (this.attributifies.has(match[1].toString())) {
  //       const oldValue = this.attributifies.get(match[1].toString())
  //       if (oldValue) {
  //         this.attributifies.set(
  //           match[1].toString(),
  //           oldValue.concat(cleanedMatch.split(' '))
  //         )
  //       }
  //     } else {
  //       this.attributifies.set(match[1].toString(), cleanedMatch.split(' '))
  //     }
  //   }
  //   return this
  // }

  public getStyles() {
    console.log('FILE-STEP: STYLES')

    const styles = {
      data: {
        inline: {
          utilities: new Set(),
          icons: new Set(),
          attributifies: new Set(),
        },
      },
    }

    styles.data.inline.utilities = new Set(this.utilities)
    styles.data.inline.icons = new Set(this.icons)

    const iA = new Map()
    this.attributifies.forEach((v, k) => {
      const unique = new Set(v)
      iA.set(k, unique)
    })

    return styles
  }
}
