/** @jsxImportSource @octane-xplat/macos-renderer */
import { createMacOSRoot, type UniversalComponent } from '@octane-xplat/macos-renderer'

function Content({ phase = 0 }: { phase?: number }) {
	const layout =
		phase === 4
			? { flexDirection: 'row', gap: 12, alignItems: 'stretch', justifyContent: 'space-between' }
			: phase === 1
				? {
						flexDirection: 'row',
						gap: 12,
						columnGap: 24,
						rowGap: 8,
						alignItems: 'end',
						justifyContent: 'end',
					}
				: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'start' }

	const classes =
		phase === 4
			? 'flex-row gap-3 items-stretch justify-between'
			: phase === 1
				? 'flex-row gap-6 items-end justify-end'
				: 'flex-row gap-3 items-center justify-start'

	return (
		<flexboxlayout>
			{['props', 'style', 'class'].map((channel) => (
				<flexboxlayout
					key={channel}
					id={channel}
					{...(channel === 'props' ? layout : {})}
					className={channel === 'class' ? classes : ''}
					style={{ width: '100%', height: 100, ...(channel === 'style' ? layout : {}) }}
				>
					<flexboxlayout id={channel + '-nested'} style={{ width: '50%' }}>
						<label text="Nested intrinsic text" />
					</flexboxlayout>
					<label id={channel + '-text'} text="Intrinsic" />
				</flexboxlayout>
			))}
			<flexboxlayout
				id="conflict"
				flexDirection={phase < 3 ? 'column' : undefined}
				gap={phase < 3 ? 4 : undefined}
				alignItems={phase < 3 ? 'stretch' : undefined}
				justifyContent={phase < 3 ? 'start' : undefined}
				className={phase < 2 ? 'flex-row gap-2 items-center justify-center' : ''}
				style={{ width: '100%', height: 100, ...(phase === 0 ? layout : {}) }}
			>
				<label id="conflict-a" text="A" />
				<label id="conflict-b" text="B" />
			</flexboxlayout>
		</flexboxlayout>
	)
}

export async function runLayoutChannelsFixture() {
	const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		{ origin: { x: 0, y: 0 }, size: { width: 600, height: 480 } },
		15,
		2,
		false,
	)

	window.releasedWhenClosed = false
	window.orderFront(null)
	const root = createMacOSRoot(window.contentView)
	const view = (id: string) => (root as any).__macosDebug.findId(id)
	const check = (ok: boolean, message: string) => {
		if (!ok) {
			throw new Error(message)
		}
	}

	const near = (a: number, b: number, message: string) =>
		check(Math.abs(a - b) < 1, message + ': ' + a + ' vs ' + b)

	const settle = () =>
		new Promise<void>((resolve) =>
			setTimeout(() => {
				window.contentView.layoutSubtreeIfNeeded()
				resolve()
			}, 40),
		)

	const compare = (phase: number) => {
		for (const channel of ['style', 'class']) {
			for (const suffix of ['-nested', '-text']) {
				const actual = view(channel + suffix).frame
				const expected = view('props' + suffix).frame
				for (const key of ['x', 'y']) {
					near(actual.origin[key], expected.origin[key], channel + suffix + '.' + key)
				}

				for (const key of ['width', 'height']) {
					near(actual.size[key], expected.size[key], channel + suffix + '.' + key)
				}
			}
		}

		const width = Number(window.contentView.bounds.size.width)
		for (const channel of ['props', 'style', 'class']) {
			near(Number(view(channel).frame.size.width), width, 'assigned frame ' + channel)
			near(
				Number(view(channel + '-nested').frame.size.width),
				width / 2,
				'percentage child ' + channel,
			)

			// NSStackView spaces alignment rectangles; NSTextField's frame
			// also includes its native text inset.
			const nestedView = view(channel + '-nested')
			const textView = view(channel + '-text')
			const nested = nestedView.alignmentRectForFrame(nestedView.frame)
			const text = textView.alignmentRectForFrame(textView.frame)
			if (phase !== 4) {
				near(
					Number(text.origin.x) - Number(nested.origin.x) - Number(nested.size.width),
					phase === 1 ? 24 : 12,
					'visible gap ' + channel,
				)
			}

			if (phase === 0) {
				near(Number(nested.origin.x), 0, 'start justification')
				near(Number(text.origin.y) + Number(text.size.height) / 2, 50, 'center alignment')
			} else if (phase === 1) {
				near(Number(text.origin.x) + Number(text.size.width), width, 'end justification')
				near(Number(text.origin.y), 0, 'end alignment')
			} else if (phase === 4) {
				near(Number(nested.origin.x), 0, 'space-between leading edge')
				near(Number(text.origin.x) + Number(text.size.width), width, 'space-between trailing edge')
			}

			check(Number(view(channel + '-text').frame.size.width) > 0, 'intrinsic text collapsed')
		}
	}

	try {
		root.render(Content as unknown as UniversalComponent, { phase: 0 })
		await settle()
		compare(0)
		check(
			Number(view('conflict').orientation) === 0 && Number(view('conflict').spacing) === 12,
			'style precedence',
		)

		for (const width of [360, 820]) {
			window.setContentSize({ width, height: 480 })
			await settle()
			near(Number(window.contentView.bounds.size.width), width, 'real window resize')
			compare(0)
		}

		root.render(Content as unknown as UniversalComponent, { phase: 1 })
		await settle()
		compare(1)
		check(
			Number(view('conflict').orientation) === 0 && Number(view('conflict').spacing) === 8,
			'style removal restores class',
		)

		root.render(Content as unknown as UniversalComponent, { phase: 2 })
		await settle()
		check(
			Number(view('conflict').orientation) === 1 && Number(view('conflict').spacing) === 4,
			'class removal restores props',
		)

		root.render(Content as unknown as UniversalComponent, { phase: 3 })
		await settle()
		check(
			Number(view('conflict').orientation) === 1 && Number(view('conflict').spacing) === 0,
			'prop removal restores defaults',
		)

		root.render(Content as unknown as UniversalComponent, { phase: 4 })
		await settle()
		compare(4)
		console.log('LAYOUT_CHANNELS_OK')
	} catch (error) {
		console.error('LAYOUT_CHANNELS_FAIL: ' + (error as Error).message)
	} finally {
		root.unmount()
		window.close()

		;(globalThis as any).__xplatStopHost()
	}
}
