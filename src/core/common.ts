import {
	applyVariant,
	buildRules,
	createRules,
	escapeCSS,
	CSSRules,
	dedupRules,
	StyleObject,
	SymbolData,
	VariantBuilder,
	isStyleArray,
	isStyleObject,
	unify,
} from '@windijs/helpers'
import { hash, hasKey } from '@windijs/shared'

export interface ExtractorConfig<T extends Record<string, object> = {}> {
	utilities: T;
	variants: Record<string, VariantBuilder>;
	extractors: Extractor[];
	separator: string;
	attributify?: {
		prefix?: string;
		separator?: string;
	};
	variantSeparator: string;
}

export type ResolvedExtractorConfig<T extends Record<string, object> = {}> = Required<ExtractorConfig<T>> & {};

export type Generator = (result: RegExpExecArray, groups?: Record<string, string | undefined>) => StyleObject | StyleObject[] | undefined;

export interface UtilityData { $selector: string }

export type Extractor =
  | ((config: ExtractorConfig) => { rule: RegExp; build: Generator })
  | ((config: ResolvedExtractorConfig) => { rule: RegExp; build: Generator });

export const BaseRule = /(^|[\s"'`])(?<important>!)?(?<variants>([\w-]+:)*)/gm

export function getNestedObject<T extends object>(root: T, paths: string[]): unknown {
	return paths.reduce((obj: object, key) => {
		const v = obj[key as keyof typeof obj]
		if (v == undefined) throw new Error(`Object has no attribute '${key}'.`)
		return v
	}, root)
}

export function setSelector(utility: StyleObject, selector: string) {
	const data = utility[SymbolData] as UtilityData | undefined
	if (data == undefined) utility[SymbolData] = { $selector: selector }
	else if (!data.$selector) (utility[SymbolData] as UtilityData).$selector = selector

	return utility
}

export function buildCSS(utilities: StyleObject[]) {
	const rules: CSSRules = []

	for (const utility of utilities) {
		const data = (utility[SymbolData] ?? {}) as UtilityData
		rules.push(...createRules(applyVariant(utility), data.$selector))
	}

	return buildRules(dedupRules(rules))
}

export function extendRegex(raw: RegExp, append: RegExp) {
	return new RegExp(raw.source + append.source, raw.flags)
}

export function generateUtilities(config: ExtractorConfig, ident: string, props: string[]) {
	const styles: StyleObject[] = []

	if (hasKey(config.utilities, ident)) {
		const utility = getNestedObject(config.utilities[ident], props)
		if (isStyleArray(utility)) styles.push(...(utility as StyleObject[]))
		else if (isStyleObject(utility)) styles.push(utility)
	}

	return styles
}

export function generateVariants(config: ExtractorConfig, styles: StyleObject[], variants: string[]) {
	return variants
		.map(k => {
			if (hasKey(config.variants, k)) return config.variants[k]
			throw new Error(`Unrecognizable variant '${k}'.`)
		})
		.reduceRight((prev, variant) => variant(...prev), styles)
}

export function extractGroup(
	groups: Record<string, string | undefined>,
	config: ExtractorConfig,
	extend: true
): { ident: string; props: string[]; variants: string[]; important: boolean } & Record<string, string | undefined>;
export function extractGroup(groups: Record<string, string | undefined>, config: ExtractorConfig, extend: false): Record<string, string | undefined>;
export function extractGroup(groups: Record<string, string | undefined>, config: ExtractorConfig, extend = false) {
	const ident = groups.ident
	if (!ident) throw new Error(`Unrecognizable utility '${ident}'`)
	if (!extend) return groups

	return {
		...groups,
		ident,
		props: groups.props?.split(config.separator).filter(Boolean) ?? [],
		variants: groups.variants?.split(config.variantSeparator).filter(Boolean),
		important: groups.important == undefined,
	}
}

export class Processor {
	config: ResolvedExtractorConfig
	constructor(config: ExtractorConfig) {
		this.config = this.resolveConfig(config)
	}

	resolveConfig(config: ExtractorConfig): ResolvedExtractorConfig {
		return {
			...config,
			attributify: config.attributify ?? {},
		}
	}

	extract(src: string) {
		let result: RegExpExecArray | null = null
		const styles: StyleObject[] = []
		const extractors = this.config.extractors.map(fn => fn(this.config))

		for (const { rule, build } of extractors)
			do {
				result = rule.exec(src)
				if (result) {
					const style = build(result, result.groups)
					if (style) {
						const selector = '.' + escapeCSS(result[0].replace(/^["'`]/, '').trim())
						if (Array.isArray(style)) styles.push(...style.map(i => setSelector(i, selector)))
						else styles.push(setSelector(style, selector))
					}
				}
			} while (result != undefined)

		return styles
	}

	interpret(src: string) {
		return buildCSS(this.extract(src))
	}

	compile(src: string, outputClassName?: string) {
		const styles = this.extract(src)

		return unify(
			'.' +
      (outputClassName ??
        'windi-' +
        hash(
        	styles
        		.map(i => ((i[SymbolData] as UtilityData) ?? {}).$selector)
        		.sort()
        		.join(','),
        )),
			styles,
		)
	}
}
