import type { TextMorphProps, TextMorphRun, TextMorphCancel } from '../types/index.js'

declare function accepts(props: TextMorphProps): void
accepts({
	value: 'Deploy\tqueued',
	className: 'status',
	style: { fontSize: 16, fontWeight: 'bold', color: 'green' },
	duration: 400,
	enabled: true,
	accessibilityLiveRegion: 'polite',
	onComplete: (run: TextMorphRun) => {
		void run.runId
		void run.from
		void run.to
	},
	onCancel: (run: TextMorphCancel) => {
		void run.reason
	},
})

accepts({ value: '' })
// @ts-expect-error Complete text must be a string.
accepts({ value: 42 })
// @ts-expect-error Rich children cannot contradict value.
accepts({ value: 'ready', children: 'different' })
// @ts-expect-error Semantic value must remain the exact latest value.
accepts({ value: 'ready', accessibilityLabel: 'different' })
// @ts-expect-error There is no queue or rolling mode.
accepts({ value: 'ready', updatePolicy: 'queue' })
// @ts-expect-error A caller cannot bypass the system motion preference.
accepts({ value: 'ready', reducedMotion: 'never' })
