import '@octane-xplat/lingui/polyfills/locales/de'
import '@octane-xplat/lingui/polyfills/time-zones/all'
import '@octane-xplat/lingui/polyfills/collator'
import '@octane-xplat/lingui/polyfills/segmenter'
import type { ProbeContext } from '../../../../scripts/probe/context'

export function run(ctx: ProbeContext) {
	ctx.assert('German number', new Intl.NumberFormat('de').format(1234.5), '1.234,5')
	ctx.assert('English plural', new Intl.PluralRules('en').select(2), 'other')
	ctx.assert('German list', new Intl.ListFormat('de').format(['a', 'b']), 'a und b')
	ctx.assert(
		'Relative date',
		new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-1, 'day'),
		'yesterday',
	)
	ctx.assert(
		'UTC year',
		new Intl.DateTimeFormat('en', { timeZone: 'UTC', year: 'numeric' }).format(0),
		'1970',
	)
	ctx.assert(
		'Named time zone',
		new Intl.DateTimeFormat('en', {
			timeZone: 'America/New_York',
			hour: 'numeric',
			hourCycle: 'h23',
		}).format(0),
		'19',
	)
	ctx.assert(
		'Numeric collation',
		new Intl.Collator('en', { numeric: true }).compare('item2', 'item10') < 0,
		true,
	)
	ctx.assert('Grapheme segmentation', [...new Intl.Segmenter('en').segment('👨‍👩‍👧‍👦')].length, 1)
	ctx.record('Intl capabilities', Object.getOwnPropertyNames(Intl))
}
