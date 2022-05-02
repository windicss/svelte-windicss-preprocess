import { parse } from 'svelte/compiler'

export interface SetObject {
  inlineClasses: Set<string>
  inlineDirectives: Set<string>
  inlineExpressions: Set<string>
  inlineIcons: Set<string>
  inlineAttributify: Map<string, Set<string>>
}

export class FileHandler {
  private content: string
  classes: string[] = []
  expressions: string[] = []
  directives: string[] = []
  attributifies: Map<string, string[]> = new Map()

  constructor(content: string) {
    console.log('CONSTRUCT')
    this.content = content
  }

  public clean(): this {
    console.log('CLEAN')
    // find a way around this
    this.content = this.content.replace(/<!--[\s\S]*?-->/g, '')

    return this
  }

  public prepare(): this {
    console.log('PREPARE')
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

  processClassAttribute(): this {
    const CLASS_MATCHES = [
      ...this.content.matchAll(/class=(['"`])(?<classes>[^\1]+?)\1/gi),
    ]
    if (CLASS_MATCHES.length < 1) return this
    for (const match of CLASS_MATCHES) {
      const cleanMatch = match.groups?.classes
        .replace(/windi[`].+?[`]/gi, ' ') // windi`XYZ`
        .replace(/(?<![-])[$](?=[{])/gi, ' ') // if leading char is not -, and next char is {, then remove $
        .replace(/(?<=([{][\w\s]+[^{]*?))['"]/gi, ' ') // remove quotes in curly braces
        .replace(/(?<=([{][\w\s]+[^{]*?)\s)[:]/gi, ' ') // remove : in curly braces
        .replace(/([{][\w\s]+[^{]*?[?])/gi, ' ') // remove ? and condition in curly braces
        .replace(/[{}]/gi, ' ') // remove curly braces
        .replace(/\n/gi, ' ') // remove newline
        .replace(/ {2,}/gi, ' ') // remove multiple spaces
        .replace(/["'`]/gi, '') // remove quotes

      this.classes = this.classes.concat(
        (cleanMatch || '').split(' ').filter(c => {
          return c.length > 0
        })
      )
    }
    return this
  }

  processClassAttributeWithCurly(): this {
    const CLASS_MATCHES = [
      ...this.content.matchAll(/class=([{])(?<classes>[^}]+?)}/gi),
    ]

    if (CLASS_MATCHES.length < 1) return this
    for (const match of CLASS_MATCHES) {
      const cleanMatch = match.groups?.classes
        .replace(/windi[`].+?[`]/gi, ' ') // windi`XYZ`
        .replace(/(?<![-])[$](?=[{])/gi, ' ') // if leading char is not -, and next char is {, then remove $
        .replace(/(?<=([{][\w\s]+[^{]*?))['"]/gi, ' ') // remove quotes in curly braces
        .replace(/(?<=([{][\w\s]+[^{]*?)\s)[:]/gi, ' ') // remove : in curly braces
        .replace(/([{][\w\s]+[^{]*?[?])/gi, ' ') // remove ? and condition in curly braces
        .replace(/[{}]/gi, ' ') // remove curly braces
        .replace(/\n/gi, ' ') // remove newline
        .replace(/ {2,}/gi, ' ') // remove multiple spaces
        .replace(/["'`]/gi, '') // remove quotes

      this.classes = this.classes.concat(
        (cleanMatch || '').split(' ').filter(c => {
          return c.length > 0
        })
      )
    }
    return this
  }

  processDirectiveClass(): this {
    const tmpContent = this.content
    const DIRECTIVE_CLASS_MATCHES = [
      ...tmpContent.matchAll(/\s(class):(?<class>[^=]+)(=)/gi),
    ]
    if (DIRECTIVE_CLASS_MATCHES.length < 1) return this
    for (const match of DIRECTIVE_CLASS_MATCHES) {
      this.directives = this.directives.concat(match[2])
      // this.directiveClassList.push(match[2])
    }
    this.content = tmpContent
    return this
  }

  processWindiExpression(): this {
    const tmpContent = this.content
    const WINDI_MATCHES = [...tmpContent.matchAll(/windi`(?<class>.*?)`/gi)]
    if (WINDI_MATCHES.length < 1) return this
    for (const match of WINDI_MATCHES) {
      const cleanedMatch = match[1]
        .replace(
          /(?<![-])[$](?=[{])|(?<=([{][\w\s]+[^{]*?))['":]|([{][\w\s]+[^{]*?[?])|^[{]|(?<=["'`)])[}]/gi,
          ' '
        )
        .replace(/ {2,}/gi, ' ')
        .replace(/["'`]/gi, '')
      this.expressions = this.expressions.concat(cleanedMatch.split(' '))
      // this.windiClassList = this.windiClassList.concat(cleanedMatch.split(' '))
    }
    this.content = tmpContent
    return this
  }

  processAttributify(): this {
    const ATTRIBUTIFY_CLASS_MATCHES = [
      ...this.content.matchAll(/([\w+:_/-]+)=(['"`])(?<classes>[^\2]+?)\2/gi),
    ]

    if (ATTRIBUTIFY_CLASS_MATCHES.length < 1) return this
    for (const match of ATTRIBUTIFY_CLASS_MATCHES) {
      if (match[1] == 'class') continue
      if (match[1] == 'href') continue
      if (match[1] == 'for') continue
      // if (match[1] == 'this') continue
      // if (match[1] == 'name') continue
      // if (match[1] == 'stroke') continue
      // if (match[1] == 'd') continue
      // if (match[1] == 'slot') continue
      // if (match[1] == 'viewBox') continue
      // if (match[1] == 'points') continue
      // if (match[1] == 'label') continue
      // if (match[1] == 'xmlns') continue
      if (match[1].startsWith('class:')) continue
      const cleanedMatch = match[3]
        .replace(
          /windi[`].+?[`]|(?<![-])[$](?=[{])|(?<=([{][\w\s]+[^{]*?))['"]|(?<=([{][\w\s]+[^{]*?))\s[:]|([{][\w\s]+[^{]*?[?])|^[{]|(?<=["'`)])[}]/gi,
          ' '
        )
        .replace(/ {2,}/gi, ' ')
        .replace(/["'`]/gi, '')
        .replace(/\n/gi, ' ')

      if (this.attributifies.has(match[1].toString())) {
        const oldValue = this.attributifies.get(match[1].toString())
        if (oldValue) {
          this.attributifies.set(
            match[1].toString(),
            oldValue.concat(cleanedMatch.split(' '))
          )
        }
      } else {
        this.attributifies.set(match[1].toString(), cleanedMatch.split(' '))
      }
    }
    return this
  }

  public scan(): this {
    console.log('SCAN')

    this.processClassAttribute()
    this.processClassAttributeWithCurly()
    this.processDirectiveClass()
    this.processWindiExpression()
    this.processAttributify()

    return this
  }

  public getStyles(): SetObject {
    console.log('GET')

    let iC: Set<string> = new Set([])
    // if (this.configuration.experimental?.icons != undefined) {
    //   iC = new Set(
    //     this.classes.filter(
    //       c =>
    //         !c.startsWith(
    //           this.configuration.experimental?.icons?.prefix || 'i-'
    //         )
    //     )
    //   )
    // } else {
    //   iC = new Set(this.classes)
    // }
    iC = new Set(this.classes)

    const iD = new Set(this.directives)

    const iE = new Set(this.expressions)

    // let iI: Set<string> = new Set([])
    // if (this.configuration.experimental?.icons != undefined) {
    //   iI = new Set(
    //     this.classes.filter(c =>
    //       c.startsWith(this.configuration.experimental?.icons?.prefix || 'i-')
    //     )
    //   )
    // }

    const iA = new Map()
    this.attributifies.forEach((v, k) => {
      const unique = new Set(v)
      iA.set(k, unique)
    })
    return {
      inlineClasses: iC,
      inlineDirectives: iD,
      inlineExpressions: iE,
      inlineIcons: new Set(),
      inlineAttributify: iA,
    }
  }
}
