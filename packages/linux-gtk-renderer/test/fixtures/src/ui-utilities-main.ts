import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import {
	DEFAULT_MIN_COLUMN_WIDTH,
	LinkContext,
	capitalize,
	createPowerSearchConfig,
	createStaticSource,
	defineTheme,
	defaultCellRenderer,
	defaultThemeTokens,
	frFR,
	generateColumns,
	generateThemeCss,
	getLocaleDirection,
	getRegisteredTheme,
	getRegisteredThemes,
	isDateInRange,
	getWeekNumber,
	isDefinedTheme,
	isNative,
	isSameDay,
	mergeProps,
	mergedRef,
	paginateData,
	percent,
	pixel,
	proportional,
	refList,
	registerTheme,
	resolveColumnWidths,
	resolveOperatorLabel,
	resolveThemeToken,
	resolveThemeTokens,
	rgbaToThumbHash,
	rgbaToThumbHashUri,
	sortTableData,
	toSearchFilters,
} from '@octane-xplat/ui'
import { Probe } from './ui-utilities.gtk'
import { results } from './ui-utilities-results'
import { FrProbe } from './ui-utilities-fr.gtk'

Gtk.init()
const window = new Gtk.Window({ title: 'Octane GTK Utilities test', default_width: 400, default_height: 300, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, { onUncaughtError(error) { throw error } })
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 250) => new Promise<void>(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false }))
let checks = 0
const failures: string[] = []
const check = (name: string, ok: boolean) => { checks++; if (!ok) { failures.push(name) } }
async function run() {
	await pause()
	// resize-math + column-utils
	check('pixel(240) shape', pixel(240).type === 'pixel' && pixel(240).value === 240)
	check('percent(50, min) shape', percent(50, { min: pixel(200) }).type === 'percent' && percent(50, { min: pixel(200) }).value === 50)
	check('proportional shape', proportional(2) != null)
	check('capitalize', capitalize('ada') === 'Ada')
	check('DEFAULT_MIN_COLUMN_WIDTH is number', typeof DEFAULT_MIN_COLUMN_WIDTH === 'number' && DEFAULT_MIN_COLUMN_WIDTH > 0)
	const cols = generateColumns([{ name: 'Ada', age: 37 }])
	check('generateColumns keys', cols.length === 2 && cols[0].key === 'name')
	const widths = resolveColumnWidths(cols as any, { width: 300 } as any)
	check('resolveColumnWidths returns', widths != null)
	check('defaultCellRenderer callable', typeof defaultCellRenderer === 'function')
	// table data
	const rows = [{ name: 'row10' }, { name: 'row2' }, { name: 'row1' }]
	check('paginateData slices', paginateData(rows, 1, 2).length === 2 && paginateData(rows, 2, 2).length === 1)
	check('sortTableData orders', sortTableData(rows, [{ sortKey: 'name', direction: 'ascending' }] as any).map((r: any) => r.name).join(',') === 'row1,row2,row10')
	check('toSearchFilters maps filters', Array.isArray(toSearchFilters({ name: ['ada'] } as any, [{ key: 'name', filter: 'name' }] as any, createPowerSearchConfig([{ key: 'name', type: 'string' }]).config as any)))
	// thumbhash (pure hash-image)
	const rgba = new Uint8Array(4 * 4 * 4).fill(128)
	const hash = rgbaToThumbHash(4, 4, rgba)
	check('rgbaToThumbHash → bytes', hash instanceof Uint8Array && hash.length > 0)
	check('rgbaToThumbHashUri → thumbhash:', rgbaToThumbHashUri(4, 4, rgba).startsWith('thumbhash:'))
	// theme registry
	const forest = defineTheme({ name: 'forest-gtk', tokens: { '--color-accent': ['#111111', '#eeeeee'] } })
	check('isDefinedTheme', isDefinedTheme(forest))
	check('defineTheme token pair', forest.tokens['--color-accent'][0] === '#111111')
	registerTheme(forest)
	check('getRegisteredTheme', getRegisteredTheme('forest-gtk') === forest)
	check('getRegisteredThemes contains', getRegisteredThemes().includes(forest))
	check('resolveThemeToken light/dark', resolveThemeToken('--color-accent', { theme: forest, mode: 'dark' }) === '#eeeeee')
	check('resolveThemeTokens dark resolves', resolveThemeTokens(forest, { mode: 'dark' })['--color-accent'] === '#eeeeee')
	check('defaultThemeTokens >200 keys', Object.keys(defaultThemeTokens).length > 200)
	const css = generateThemeCss(forest)
	check('generateThemeCss contains var', typeof css === 'string' && css.includes('--color-accent'))
	// platform + prop/ref utils
	check('isNative true on GTK', isNative === true)
	const merged = mergeProps({ className: 'one', style: { color: 'red', padding: 2 }, role: 'list', id: 'a' } as any, { className: 'two', style: { margin: 8, padding: 2 }, id: 'b' } as any)
	check('mergeProps className joins', merged.className === 'one two')
	check('mergeProps style merges', (merged.style as any).color === 'red' && (merged.style as any).margin === 8)
	check('mergeProps later wins', merged.id === 'b')
	const calls: any[] = []
	const cbA = () => calls.push('a')
	const cbB = () => calls.push('b')
	const flat = refList(cbA, [cbB] as any)
	check('refList flattens', flat.length === 2 && flat[0] === cbA && flat[1] === cbB)
	const mr = mergedRef(() => calls.push('fa'), () => calls.push('bl'))
	mr(null)
	check('mergedRef calls both', calls.slice(-2).join(',') === 'fa,bl')
	// static source
	const cities = [{ id: 'JFK', label: 'New York' }, { id: 'SFO', label: 'San Francisco' }]
	const source = createStaticSource(cities, { keywords: (item: any) => [item.id] })
	check('createStaticSource search hit', source.search('YORK')[0] === cities[0])
	check('createStaticSource id hit', source.search('SFO')[0] === cities[1])
	check('createStaticSource empty=all', source.search('').length === 2)
	check('createStaticSource bootstrap', source.bootstrap().length === 2)
	// calendar core
	check('isSameDay', isSameDay('2024-02-10', '2024-02-10') === true && isSameDay('2024-02-10', '2024-02-11') === false)
	check('isDateInRange', isDateInRange('2024-02-10', { start: '2024-02-01', end: '2024-02-28' }) === true)
	check('getWeekNumber returns number', typeof getWeekNumber('2024-02-10') === 'number')
	// i18n + links + power search config
	check('getLocaleDirection', getLocaleDirection('en') === 'ltr' && getLocaleDirection('ar') === 'rtl')
	check('frFR dictionary', frFR['@astryx.selector.placeholder'] === 'Sélectionner…')
	check('LinkContext exists', LinkContext != null)
	const pconfig = createPowerSearchConfig([{ key: 'name', type: 'string' }, { key: 'age', type: 'number' }])
	check('createPowerSearchConfig fields', pconfig.config.fields.map((f: any) => f.key).join(',') === 'name,age')
	check('resolveOperatorLabel label passthrough', resolveOperatorLabel({ label: 'Equals' } as any) === 'Equals')
	// hooks through createGtkRoot
	root.render(Probe, {})
	await pause()
	check('useLocale default en', results.locale === 'en' || results.locale === 'en-US')
	check('useDirection ltr', results.direction === 'ltr')
	check('useTranslator en', results.placeholder === 'Select…')
	check('useObjectRef shape', results.objectRefShape === true)
	check('useLinkComponent via provider', results.linkComponent === true)
	root.render(FrProbe, {})
	await pause()
	check('useTranslator frFR', results.frPlaceholder === 'Sélectionner…')
	check('useTranslator frFR search', results.frSearchPlaceholder === 'Rechercher…')
	root.unmount()
	await pause()
	check('unmount releases nodes', container.nodes.size === 0)
	print('GTK_UTILITIES ' + JSON.stringify({ checks, failures, osInput: false, gtk: [Gtk.MAJOR_VERSION, Gtk.MINOR_VERSION, Gtk.MICRO_VERSION].join('.') }))
	if (failures.length) { throw new Error(failures.join('; ')) }
}
let failed = false
run().catch(error => { failed = true; printerr(String(error)); printerr(error.stack ?? '') })
.finally(() => { root.unmount(); window.destroy(); loop.quit() })
loop.run()
if (failed) { imports.system.exit(1) }
