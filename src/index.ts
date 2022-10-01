import { style } from '@windijs/style'
import * as utilities from '@windijs/utilities'
import * as variants from '@windijs/variants'
import type { PreprocessorGroup, Processed } from 'svelte/types/compiler/preprocess'
import { styleArbitraryExtractor, utilityArbitraryExtractor } from './core/arbitrary'
import { attributifyExtractor } from './core/attributify'
import { Processor } from './core/common'
import { utilityExtractor } from './core/utility'

export function windi(): PreprocessorGroup {
	return {
		markup: async ({ content, filename }): Promise<Processed> => {
			const processor = new Processor({
				separator: '-',
				variantSeparator: ':',
				utilities: {
					...utilities,
					style,
				},
				attributify: {
					prefix: 'w:',
				},
				variants,
				extractors: [utilityExtractor, utilityArbitraryExtractor, styleArbitraryExtractor, attributifyExtractor],
			})

			console.warn('the experimental version of windi v4 is not ready for production and yet to be implemented.')
			return {
				code: content,
			}
		},
		// script: () => {},
		// style: () => {},
	}
}

export default windi
