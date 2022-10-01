import { BaseRule, extendRegex, extractGroup, ExtractorConfig, generateUtilities, generateVariants } from './common'

export function utilityExtractor<T extends Record<string, object>>(config: ExtractorConfig<T>) {
	function build(result: RegExpExecArray, groups: Record<string, string | undefined> = {}) {
		const { ident, props, variants } = extractGroup(groups, config, true)
		// TODO: support important

		const styles = generateUtilities(config, ident, props)
		return variants ? generateVariants(config, styles, variants) : styles
	}

	return { rule: extendRegex(BaseRule, /(?<ident>\w+)(?<props>(-\w+)*)(?=[\s"'`]|$)/), build }
}
