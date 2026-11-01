/** @jsxImportSource @octane-xplat/jsx */
import { Icon, IconRegistryProvider, View, createIconRegistry, registerIcon, registerIcons } from '@octane-xplat/ui'

export const left = createIconRegistry()
export const right = createIconRegistry()
left.registerIcon('local', { svg: 'M0 0h12v8H0z', viewBox: '0 0 12 8' })
right.registerIcons({ local: { markup: '<circle cx="4" cy="6" r="3" fill="currentColor"/>', viewBox: '0 0 8 12' } })
registerIcon('fixture-text', { text: '✓' })
registerIcons({ 'fixture-font': { font: { family: 'sans-serif', glyph: '+' } } })

export function Icons(props: { version: number; remote: string; source?: any; showRaw?: boolean; dropRaw?: boolean }) @{
	<View id="icons-root" style={{ width: 280, height: 300, color: props.version === 1 ? '#123456' : '#654321' }}>
		<Icon id="builtin" name={props.version === 1 ? 'xplat-search' : 'xplat-clear'} size={props.version === 1 ? 20 : 32} />
		<IconRegistryProvider value={props.version === 1 ? left : right}>
			<Icon id="scoped" name="local" size={24} color="accent" accessibilityLabel="Local action" />
			<Icon id="override" name="local" size={16} registry={left} />
		</IconRegistryProvider>
		<Icon id="text-icon" name="fixture-text" size={18} />
		<Icon id="font-icon" name="fixture-font" size={18} />
		<Icon id="missing-icon" name={'fixture-unregistered' as any} />
		<Icon id="remote-icon" name="remote" registry={createIconRegistryForSource(props.remote)} size={20} />
		{props.showRaw ? (
			<svgview id="raw-picture" src={props.dropRaw ? undefined : props.source} stretch="aspectFit" style={{ width: 40, height: 30 }} />
		) : null}
	</View>
}
function createIconRegistryForSource(src: string) {
	const registry = createIconRegistry()
	registry.registerIcon('remote', { src })
	return registry
}
