import { defineUniversalComponent } from 'octane/universal/native'
import {
	useDirection,
	useLinkComponent,
	useLocale,
	useObjectRef,
	useTranslator,
} from '@octane-xplat/ui'
import { results } from './ui-utilities-results'

export const Inner = defineUniversalComponent('gtk', function Inner() {
	const translate = useTranslator()
	results.locale = useLocale()
	results.direction = useDirection()
	results.placeholder = translate('@astryx.selector.placeholder')
	results.searchPlaceholder = translate('@astryx.selector.searchPlaceholder')
	const ref = useObjectRef<any>()
	results.objectRefShape = ref != null && 'current' in ref && ref.current === null
	const Link = useLinkComponent()
	results.linkComponent = typeof Link === 'function'
	return null
})

export const FrInner = defineUniversalComponent('gtk', function FrInner() {
	const translate = useTranslator()
	results.frPlaceholder = translate('@astryx.selector.placeholder')
	results.frSearchPlaceholder = translate('@astryx.selector.searchPlaceholder')
	return null
})
