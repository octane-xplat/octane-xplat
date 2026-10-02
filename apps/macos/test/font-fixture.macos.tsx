/** @jsxImportSource @octane-xplat/macos-renderer */
import { createMacOSRoot } from '@octane-xplat/macos-renderer'

function Content({ weight = 400 }) {
	return (
		<stack>
			<label id="default" text="Default" style={{ fontSize: 22, fontWeight: weight }} />
			<label
				id="system"
				text="System"
				style={{ fontFamily: 'system-ui', fontSize: 18, fontWeight: 700 }}
			/>
			<label
				id="missing"
				text="Missing"
				style={{ fontFamily: 'Xplat Missing Family', fontSize: 18 }}
			/>
			<textfield id="input" value="Input" className="vx-input" />
		</stack>
	)
}

export function runFontFixture(options = {}, custom = false) {
	const host = NSView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 400, height: 200 },
	})

	const root = createMacOSRoot(host, options)

	const required = (id) => root.__macosDebug.findId(id).font
	const check = (condition, message) => {
		if (!condition) {
			throw new Error(message)
		}
	}

	root.render(Content, { weight: 400 })
	setTimeout(() => {
		try {
			check(
				String(root.__macosDebug.findId('default').stringValue) === 'Default',
				'Styles erased label text',
			)

			check(Number(required('default').pointSize) === 22, 'Font size was lost')
			check(
				String(required('default').fontName) ===
					String(custom ? 'Geist-Regular' : NSFont.systemFontOfSizeWeight(22, 0).fontName),
				'Root default font differs',
			)

			check(
				String(required('system').fontName) ===
					String(NSFont.systemFontOfSizeWeight(18, 0.4).fontName),
				'Explicit system bold differs',
			)

			check(
				String(required('missing').fontName) ===
					String(NSFont.systemFontOfSizeWeight(18, 0).fontName),
				'Unavailable family did not fall back',
			)

			check(
				String(required('input').fontName) ===
					String(custom ? 'Geist-Regular' : NSFont.systemFontOfSizeWeight(14, 0).fontName),
				'Input lost root font',
			)

			root.render(Content, { weight: 700 })
			setTimeout(() => {
				try {
					check(
						String(required('default').fontName) ===
							String(custom ? 'Geist-Bold' : NSFont.systemFontOfSizeWeight(22, 0.4).fontName),
						'Weight update was lost',
					)

					root.unmount()
					console.log(custom ? 'CUSTOM_FONT_OK' : 'SYSTEM_FONT_OK')
				} catch (error) {
					console.error('FONT_FIXTURE_FAIL: ' + error.message)
				} finally {
					globalThis.__xplatStopHost()
				}
			}, 30)
		} catch (error) {
			console.error('FONT_FIXTURE_FAIL: ' + error.message)
			globalThis.__xplatStopHost()
		}
	}, 30)
}
