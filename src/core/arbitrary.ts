import { extendRegex, ExtractorConfig, generateVariants, extractGroup, getNestedObject, BaseRule, Generator } from './common'
import { hasKey, isColor, isGradient, isNumber, isPosition, isSize, isUrl } from '@windijs/shared'
import { css, CSSDataTypes, StyleObject, StyleProperties } from '@windijs/helpers'
import {
	buildBoxShadowColor,
	buildBoxShadowSize,
	buildColor,
	buildDivideColor,
	buildDivideX,
	buildDivideY,
	buildGradientFrom,
	buildGradientTo,
	buildGradientVia,
	buildRingWidth,
	buildSpaceBetweenX,
	buildSpaceBetweenY,
	buildStatic,
} from '@windijs/core'

// TODO: support aribitary in utilities, maybe like, `bg("#1c1c1e")` `scroll.p("4rem")`, for now we just hard code here.

interface ArbitaryObject {
	[key: string]: StyleProperties | StyleProperties[] | ((value: string, type?: CSSDataTypes) => StyleObject) | ArbitaryObject;
}

const Arbitaries: ArbitaryObject = {
	animate: 'animation',
	delay: 'transitionDelay',
	ease: 'transitionTimingFunction',
	duration: 'transitionDuration',
	transition: v => css({ transitionProperty: v, transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)', transitionDuration: '150ms' }),
	aspect: 'aspectRatio',
	basis: 'flexBasis',
	columns: 'columns',
	flex: 'flex',
	grow: 'flexGrow',
	shrink: 'flexShrink',
	order: 'order',
	object: 'objectPosition',
	opacity: 'opacity',
	bg: {
		DEFAULT: (value, type) => {
			if (type === 'color') return buildColor('backgroundColor', '--w-bg-opacity', value)
			if (type === 'position') return css({ backgroundPosition: value })
			if (type === 'length') return css({ backgroundSize: value })
			if (type === 'url' || type === 'image') return css({ backgroundImage: value })
			return css({ background: value })
		},
		opacity: '--w-bg-opacity' as StyleProperties,
	},
	from: buildGradientFrom,
	via: buildGradientVia,
	to: buildGradientTo,
	text: {
		DEFAULT: (value, type) => (type === 'color' ? buildColor('color', '--w-text-opacity', value) : css({ fontSize: value })),
		opacity: '--w-text-opacity' as StyleProperties,
	},
	accent: 'accentColor',
	cursor: 'cursor',
	caret: 'caretColor',
	blur: v => css({ '--w-blur': `blur(${v})` }),
	brightness: v => css({ '--w-brightness': `brightness(${v})` }),
	contrast: v => css({ '--w-contrast': `contrast(${v})` }),
	drop: {
		shadow: v => css({ '--w-drop-shadow': `opacity(${v})` }),
	},
	grayscale: v => css({ '--w-grayscale': `grayscale(${v})` }),
	hueRotate: v => css({ '--w-hue-rotate': `hue-rotate(${v})` }),
	invert: v => css({ '--w-invert': `invert(${v})` }),
	sepia: v => css({ '--w-sepia': `sepia(${v})` }),
	saturate: v => css({ '--w-saturate': `saturate(${v})` }),
	backdrop: {
		blur: v => css({ '--w-backdrop-blur': `blur(${v})` }),
		brightness: v => css({ '--w-backdrop-brightness': `brightness(${v})` }),
		contrast: v => css({ '--w-backdrop-contrast': `contrast(${v})` }),
		grayscale: v => css({ '--w-backdrop-grayscale': `grayscale(${v})` }),
		hueRotate: v => css({ '--w-backdrop-hue-rotate': `hue-rotate(${v})` }),
		invert: v => css({ '--w-backdrop-invert': `invert(${v})` }),
		opacity: v => css({ '--w-backdrop-opacity': `opacity(${v})` }),
		sepia: v => css({ '--w-backdrop-sepia': `sepia(${v})` }),
		saturate: v => css({ '--w-backdrop-saturate': `saturate(${v})` }),
	},
	scale: {
		DEFAULT: ['--w-scale-x' as StyleProperties, '--w-scale-y' as StyleProperties, '--w-scale-z' as StyleProperties],
		x: '--w-scale-x' as StyleProperties,
		y: '--w-scale-y' as StyleProperties,
		z: '--w-scale-z' as StyleProperties,
	},
	rotate: {
		DEFAULT: '--w-rotate' as StyleProperties,
		x: '--w-rotate-x' as StyleProperties,
		y: '--w-rotate-y' as StyleProperties,
		z: '--w-rotate-z' as StyleProperties,
	},
	translate: {
		DEFAULT: ['--w-translate-x' as StyleProperties, '--w-translate-y' as StyleProperties, '--w-translate-z' as StyleProperties],
		x: '--w-translate-x' as StyleProperties,
		y: '--w-translate-y' as StyleProperties,
		z: '--w-translate-z' as StyleProperties,
	},
	skew: {
		DEFAULT: ['--w-skew-x' as StyleProperties, '--w-skew-y' as StyleProperties],
		x: '--w-skew-x' as StyleProperties,
		y: '--w-skew-y' as StyleProperties,
	},
	origin: 'transformOrigin',
	scroll: {
		p: 'scrollPadding',
		px: ['scrollPaddingLeft', 'scrollPaddingRight'],
		py: ['scrollPaddingTop', 'scrollPaddingBottom'],
		pt: 'scrollPaddingTop',
		pr: 'scrollPaddingRight',
		pb: 'scrollPaddingBottom',
		pl: 'scrollPaddingLeft',
		m: 'scrollMargin',
		mx: ['scrollMarginLeft', 'scrollMarginRight'],
		my: ['scrollMarginTop', 'scrollMarginBottom'],
		mt: 'scrollMarginTop',
		mr: 'scrollMarginRight',
		mb: 'scrollMarginBottom',
		ml: 'scrollMarginLeft',
	},
	grid: {
		rows: 'gridTemplateRows',
		cols: 'gridTemplateColumns',
	},
	row: {
		DEFAULT: 'gridRow',
		span: v => css({ gridRow: `span ${v} / span ${v}` }),
		start: 'gridRowStart',
		end: 'gridRowEnd',
	},
	col: {
		DEFAULT: 'gridColumn',
		span: v => css({ gridColumn: `span ${v} / span ${v}` }),
		start: 'gridColumnStart',
		end: 'gridColumnEnd',
	},
	inset: {
		DEFAULT: ['top', 'right', 'bottom', 'left'],
		x: ['left', 'right'],
		y: ['top', 'bottom'],
	},
	gap: {
		DEFAULT: 'gap',
		x: 'columnGap',
		y: 'rowGap',
	},
	auto: {
		rows: 'gridAutoRows',
		cols: 'gridAutoColumns',
	},
	p: 'padding',
	px: ['paddingLeft', 'paddingRight'],
	py: ['paddingTop', 'paddingBottom'],
	pt: 'paddingTop',
	pr: 'paddingRight',
	pb: 'paddingBottom',
	pl: 'paddingLeft',
	m: 'margin',
	mx: ['marginLeft', 'marginRight'],
	my: ['marginTop', 'marginBottom'],
	mt: 'marginTop',
	mr: 'marginRight',
	mb: 'marginBottom',
	ml: 'marginLeft',
	space: {
		x: buildSpaceBetweenX,
		y: buildSpaceBetweenY,
	},
	w: 'width',
	h: 'height',
	min: {
		w: 'minWidth',
		h: 'minHeight',
	},
	max: {
		w: 'maxWidth',
		h: 'maxHeight',
	},
	font: (value, type) => css({ [type === 'number' ? 'fontWeight' : 'fontFamily']: value }),
	tracking: 'letterSpacing',
	leading: 'lineHeight',
	list: 'listStyleType',
	decoration: (value, type) => css({ [type === 'length' ? 'textDecorationThickness' : 'textDecorationColor']: value }),
	underline: {
		offset: 'textUnderlineOffset',
	},
	rounded: {
		DEFAULT: 'borderRadius',
		t: ['borderTopLeftRadius', 'borderTopRightRadius'],
		b: ['borderBottomRightRadius', 'borderBottomLeftRadius'],
		l: ['borderTopLeftRadius', 'borderBottomLeftRadius'],
		r: ['borderTopRightRadius', 'borderBottomRightRadius'],
		tl: 'borderTopLeftRadius',
		tr: 'borderTopRightRadius',
		bl: 'borderBottomLeftRadius',
		br: 'borderBottomRightRadius',
	},
	border: {
		DEFAULT: (value, type) => (type === 'color' ? buildColor('borderColor', '--w-border-opacity', value) : css({ borderWidth: value })),
		x: (value, type) =>
			type === 'color'
				? buildColor(['borderLeftColor', 'borderRightColor'], '--w-border-opacity', value)
				: (buildStatic(['borderLeftWidth', 'borderRightWidth'], value) as StyleObject),
		y: (value, type) =>
			type === 'color'
				? buildColor(['borderTopColor', 'borderBottomColor'], '--w-border-opacity', value)
				: (buildStatic(['borderTopWidth', 'borderBottomWidth'], value) as StyleObject),
		t: (value, type) => (type === 'color' ? buildColor('borderTopColor', '--w-border-opacity', value) : css({ borderTopWidth: value })),
		r: (value, type) => (type === 'color' ? buildColor('borderRightColor', '--w-border-opacity', value) : css({ borderRightWidth: value })),
		b: (value, type) => (type === 'color' ? buildColor('borderBottomColor', '--w-border-opacity', value) : css({ borderBottomWidth: value })),
		l: (value, type) => (type === 'color' ? buildColor('borderLeftColor', '--w-border-opacity', value) : css({ borderLeftWidth: value })),
		spacing: {
			DEFAULT: 'borderSpacing',
			x: v => css({ borderSpacing: `${v} var(--w-border-spacing-y)` }),
			y: v => css({ borderSpacing: `var(--w-border-spacing-x) ${v}` }),
		},
		opacity: '--w-border-opacity' as StyleProperties,
	},
	divide: {
		DEFAULT: buildDivideColor,
		x: buildDivideX,
		y: buildDivideY,
	},
	outline: {
		DEFAULT: (value, type) => (type === 'color' ? buildColor('outlineColor', '--w-outline-opacity', value) : css({ outlineWidth: value })),
		offset: 'outlineOffset',
		opacity: '--w-outline-opacity' as StyleProperties,
	},
	ring: {
		DEFAULT: (value, type) => (type === 'color' ? buildColor('--w-ring-color' as StyleProperties, '--w-ring-opacity', value) : buildRingWidth(value)),
		offset: {
			DEFAULT: (value, type) =>
				type === 'color'
					? buildColor('--w-ring-offset-color' as StyleProperties, '--w-ring-offset-opacity', value)
					: css({ '--w-ring-offset-width': value }),
			opacity: '--w-ring-offset-opacity' as StyleProperties,
		},
		opacity: '--w-ring-opacity' as StyleProperties,
	},
	shadow: {
		DEFAULT: (value, type) => (type === 'color' ? buildBoxShadowColor(value) : buildBoxShadowSize(value)),
		opacity: '--w-shadow-color-opacity' as StyleProperties,
	},
	fill: 'fill',
	stroke: (value, type) => css({ [type === 'length' ? 'strokeWidth' : 'stroke']: value }),
	indent: 'textIndent',
	align: 'verticalAlign',
	content: 'content',
	z: 'zIndex',
	top: 'top',
	right: 'right',
	bottom: 'bottom',
	left: 'left',
	will: {
		change: 'willChange',
	},
}

const ArbitraryTypeRegex =
  /^((color|string|url|integer|number|dimension|percentage|ratio|flex|resolution|alpha-value|image|position)|((length|frequency|angle|time)(-percentage)?)):/

export function parseArbitrary(value: string): { type: CSSDataTypes | undefined; value: string } {
	value = value.replace(/_/g, ' ')
	let type: CSSDataTypes | undefined
	const arbitraryMatched = ArbitraryTypeRegex.exec(value)

	if (arbitraryMatched != undefined) {
		type = arbitraryMatched[1] as CSSDataTypes
		value = value.slice(arbitraryMatched[0].length)
	} else if (isSize(value)) type = 'length'
	else if (isColor(value)) type = 'color'
	else if (isNumber(value)) type = 'number'
	else if (isUrl(value)) type = 'url'
	else if (isPosition(value)) type = 'position'
	else if (isGradient(value)) type = 'image'
	// else if (isFraction(value)) {
	//   type = "percentage";
	//   value = fracToPercent(value) ?? value;
	// }

	return { type, value }
}

function buildArbitrary(prop: ArbitaryObject[string], value: string, type: CSSDataTypes | undefined): StyleObject {
	if (typeof prop === 'function') return prop(value, type)
	if (Array.isArray(prop)) return css(Object.fromEntries(prop.map(i => [i, value])))
	if (typeof prop === 'object') return buildArbitrary(prop.DEFAULT, value, type)

	return css({ [prop]: value })
}

// bg-[#1c1c1e] ...
export function utilityArbitraryExtractor<T extends Record<string, object>>(config: ExtractorConfig<T>) {
	const build: Generator = (result: RegExpExecArray, groups: Record<string, string | undefined> = {}) => {
		const { ident, props, variants, important, arbitrary } = extractGroup(groups, config, true)
		// TODO: support important

		if (!arbitrary) throw new Error('Unexpected empty arbitrary value')

		const styles: StyleObject[] = []

		if (hasKey(Arbitaries, ident)) {
			const arbv = Arbitaries[ident]
			const prop = typeof arbv === 'object' ? (getNestedObject(arbv, props) as ArbitaryObject[string]) : arbv

			const { type, value } = parseArbitrary(arbitrary)
			styles.push(buildArbitrary(prop, value, type))
		}

		return variants ? generateVariants(config, styles, variants) : styles
	}

	return { rule: extendRegex(BaseRule, /(?<ident>\w+)(?<props>(-\w+)*)-\[(?<arbitrary>[^\s\]]+)](?=[\s"'`]|$)/), build }
}

// [mask-type:luminance] ...
export function styleArbitraryExtractor<T extends Record<string, object>>(config: ExtractorConfig<T>) {
	function build(result: RegExpExecArray, groups: Record<string, string | undefined> = {}) {
		// const { ident, props, variants, important, arbitrary } = extractGroup(groups, true);
		// TODO: support important

		const variants = groups.variants?.split(config.variantSeparator).filter(Boolean)
		const important = groups.important == undefined
		const prop = groups.property
		const arbitrary = groups.arbitrary

		if (!prop) throw new Error('Unexpected empty arbitrary property')
		if (!arbitrary) throw new Error('Unexpected empty arbitrary value')

		const styles = [css({ [prop]: arbitrary.replace(/_/g, ' ') })]

		return variants ? generateVariants(config, styles, variants) : styles
	}

	return { rule: extendRegex(BaseRule, /\[(?<property>[\w-]+):(?<arbitrary>[^\s\]]+)](?=[\s"'`]|$)/), build }
}
