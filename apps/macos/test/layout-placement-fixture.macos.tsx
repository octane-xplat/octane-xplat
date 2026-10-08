/** @jsxImportSource @octane-xplat/macos-renderer */
import { createMacOSRoot, type UniversalComponent } from '@octane-xplat/macos-renderer'

function Panel() {
	return (
		<flexboxlayout id="panel" left={10} top={12} bottom={18} style={{ width: 268 }}>
			<flexboxlayout id="header" style={{ height: 44 }}>
				<label text="Panel header" />
			</flexboxlayout>
			<scrollview id="scroll" className="flex-1">
				<flexboxlayout>
					{Array.from({ length: 30 }, (_, index) => (
						<label key={index} text={'Row ' + index} style={{ height: 32 }} />
					))}
				</flexboxlayout>
			</scrollview>
			<flexboxlayout id="footer" style={{ height: 36 }}>
				<label text="Panel footer" />
			</flexboxlayout>
		</flexboxlayout>
	)
}

function AbsolutePanel() {
	return (
		<absolutelayout id="container">
			<Panel />
		</absolutelayout>
	)
}

function GridPanel() {
	return (
		<gridlayout id="container" rows="12 1* 18" columns="10 268 1*">
			<flexboxlayout id="panel" row={1} col={1}>
				<flexboxlayout id="header" style={{ height: 44 }}>
					<label text="Panel header" />
				</flexboxlayout>
				<scrollview id="scroll" className="flex-1">
					<flexboxlayout>
						<label text="Scrollable rows" style={{ height: 960 }} />
					</flexboxlayout>
				</scrollview>
				<flexboxlayout id="footer" style={{ height: 36 }}>
					<label text="Panel footer" />
				</flexboxlayout>
			</flexboxlayout>
		</gridlayout>
	)
}

export async function runLayoutPlacementFixture(stopHost = true) {
	const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		{ origin: { x: 180, y: 160 }, size: { width: 288, height: 803 } },
		15,
		2,
		false,
	)

	window.releasedWhenClosed = false
	// No required contentView size pins: placement must not defeat AppKit's
	// WindowSizeStayPut priority and shrink the host to content fitting size.
	window.orderFront(null)
	const root = createMacOSRoot(window.contentView)
	const view = (id: string) => (root as any).__macosDebug.findId(id)
	const near = (actual: number, expected: number, message: string) => {
		if (
			!Number.isFinite(actual) ||
			!Number.isFinite(expected) ||
			Math.abs(actual - expected) >= 1
		) {
			throw new Error(message + ': ' + actual + ' vs ' + expected)
		}
	}

	const settle = () =>
		new Promise<void>((resolve) =>
			setTimeout(() => {
				window.contentView.layoutSubtreeIfNeeded()
				resolve()
			}, 40),
		)

	try {
		for (const Component of [AbsolutePanel, GridPanel]) {
			const initialOrigin = window.frame.origin
			root.render(Component as unknown as UniversalComponent)
			await settle()
			near(Number(window.contentView.bounds.size.width), 288, 'initial host width')
			near(Number(window.contentView.bounds.size.height), 803, 'initial host height')
			near(Number(window.frame.origin.x), Number(initialOrigin.x), 'initial host x')
			near(Number(window.frame.origin.y), Number(initialOrigin.y), 'initial host y')
			for (const size of [
				{ width: 288, height: 803 },
				{ width: 420, height: 640 },
				{ width: 288, height: 803 },
			]) {
				window.setContentSize(size)
				const origin = window.frame.origin
				for (let solve = 0; solve < 3; solve++) {
					await settle()
					near(Number(window.contentView.bounds.size.width), size.width, 'host width')
					near(Number(window.contentView.bounds.size.height), size.height, 'host height')
					near(Number(window.frame.origin.x), Number(origin.x), 'host x')
					near(Number(window.frame.origin.y), Number(origin.y), 'host y')
					const panel = view('panel').frame
					near(Number(panel.origin.x), 10, 'panel leading')
					near(Number(panel.origin.y), 18, 'panel bottom')
					near(Number(panel.size.width), 268, 'panel width')
					near(Number(panel.size.height), size.height - 30, 'panel height')
					for (const id of ['header', 'scroll', 'footer']) {
						near(Number(view(id).frame.size.width), 268, id + ' assigned width')
					}

					near(
						Number(view('header').frame.origin.y) + Number(view('header').frame.size.height),
						size.height - 30,
						'top-packed header',
					)

					near(Number(view('footer').frame.origin.y), 0, 'bottom footer')
					near(Number(view('scroll').frame.size.height), size.height - 110, 'growing scroll height')
				}
			}
		}

		console.log('LAYOUT_PLACEMENT_OK')
	} catch (error) {
		console.error('LAYOUT_PLACEMENT_FAIL: ' + (error as Error).message)
		throw error
	} finally {
		root.unmount()
		window.close()
		if (stopHost) {
			;(globalThis as any).__xplatStopHost()
		}
	}
}
