import '@nativescript/macos-node-api'
import * as renderer from '@octane-xplat/macos-renderer'
import * as native from 'octane/universal/native'
import * as signals from 'octane/signals'
import * as signalClient from 'octane/signals/client'
import * as internal from 'octane/internal/client'

globalThis.__xplatDevModules = {
	'@octane-xplat/macos-renderer': renderer,
	'octane/universal/native': native,
	'octane/signals': signals,
	'octane/signals/client': signalClient,
	'octane/internal/client': internal,
}

const app = NSApplication.sharedApplication
const hostView = NSView.alloc().initWithFrame({
	origin: { x: 0, y: 0 },
	size: { width: 400, height: 200 },
})

const root = renderer.createMacOSRoot(hostView)
const debug = (root as any).__macosDebug
let liveComponent: any
let retainedSegment: any
let retainedProgress: any
let retainedList: any
let retainedDate: any
let retainedActivity: any
let retainedHtml: any
let retainedFormatted: any
let retainedFormattedParent: any
let retainedLabel: any
let retainedContent: any
let retainedChild: any
let retainedDock: any
let retainedDockChild: any
let retainedWrap: any
let retainedWrapChild: any
let retainedProxy: any
let retainedProxyChild: any
let retainedSearch: any
let retainedRoot: any
let retainedRootChild: any
let reloaded = false
function reload() {
	const loaded = __hostRunFile(process.env.OCTANE_MACOS_DEV_BUNDLE!)
	if (!liveComponent) {
		liveComponent = native.hmrUniversalComponent('macos', loaded.default ?? loaded)
		root.render(liveComponent, {})
		setTimeout(() => {
			retainedSegment = debug.findId('hmr-segment')
			retainedProgress = debug.findId('hmr-progress')
			retainedList = debug.findId('hmr-list')
			retainedDate = debug.findId('hmr-date')
			retainedActivity = debug.findId('hmr-activity')
			retainedHtml = debug.findId('hmr-html')
			retainedFormatted = debug.findId('hmr-formatted')
			retainedFormattedParent = debug.findId('hmr-formatted-parent')
			retainedSearch = debug.findId('hmr-search')
			retainedRoot = debug.findId('hmr-root')
			retainedRootChild = debug.findId('root-revision')
			retainedLabel = debug.findId('count')
			retainedContent = debug.findId('hmr-content')
			retainedChild = debug.findId('revision')
			retainedDock = debug.findId('hmr-dock')
			retainedDockChild = debug.findId('dock-revision')
			retainedWrap = debug.findId('hmr-wrap')
			retainedWrapChild = debug.findId('wrap-revision')
			retainedProxy = debug.findId('hmr-proxy')
			retainedProxyChild = debug.findId('proxy-revision')
			debug.pressId('increment')
			setTimeout(() => {
				if ((Number(retainedActivity.alphaValue) === 0)) {console.error('PACKED_HMR_FAIL: busy signal did not start spinner')}
				if (Number(retainedProgress.doubleValue) !== 25) {console.error('PACKED_HMR_FAIL: Progress signal did not update bar')}
				console.log('HMR_CONSUMER_READY')
			}, 60)
		}, 60)
	} else {
		liveComponent[native.UNIVERSAL_HMR].update(loaded.default ?? loaded)
		setTimeout(() => {
			const label = debug.findId('count')
			const revision = debug.findId('revision')
			if (
				debug.findId('hmr-segment') === retainedSegment && Number(retainedSegment.selectedSegment) === 1 && String(retainedSegment.labelForSegment(0)) === 'Second revision' &&
				debug.findId('hmr-progress') === retainedProgress && !retainedProgress.indeterminate && Number(retainedProgress.doubleValue) === 40 && Number(retainedProgress.maxValue) === 100 &&
				debug.findId('hmr-list') === retainedList && Number(retainedList.indexOfSelectedItem) === 1 && String(retainedList.itemAtIndex(0).title) === 'Second revision' &&
				debug.findId('hmr-date') === retainedDate && new Date(Number(retainedDate.dateValue.timeIntervalSince1970) * 1000).getDate() === 13 && new Date(Number(retainedDate.dateValue.timeIntervalSince1970) * 1000).getHours() === 0 &&
				debug.findId('hmr-activity') === retainedActivity && (Number(retainedActivity.alphaValue) === 0) &&
				debug.findId('hmr-html') === retainedHtml &&
				String(retainedHtml.stringValue).trim() === 'Second revision1' &&
				debug.findId('hmr-formatted') === retainedFormatted &&
				retainedFormatted.view === null &&
				debug.findId('hmr-formatted-parent') === retainedFormattedParent &&
				String(retainedFormattedParent.stringValue) === 'Second revision1' &&
				debug.findId('hmr-search') === retainedSearch &&
				String(retainedSearch.stringValue) === 'Second revision' &&
				String(retainedSearch.placeholderString) === '1' &&
				debug.findId('hmr-root') === retainedRoot &&
				debug.findId('root-revision') === retainedRootChild &&
				retainedRootChild.superview === retainedRoot &&
				String(retainedRootChild.stringValue) === 'Second revision' &&
				debug.findId('hmr-proxy') === retainedProxy &&
				retainedProxy.view === null &&
				debug.findId('proxy-revision') === retainedProxyChild &&
				String(retainedProxyChild.stringValue) === 'Second revision' &&
				debug.findId('hmr-wrap') === retainedWrap &&
				debug.findId('wrap-revision') === retainedWrapChild &&
				retainedWrapChild.superview === retainedWrap &&
				String(retainedWrapChild.stringValue) === 'Second revision' &&
				debug.findId('hmr-dock') === retainedDock &&
				debug.findId('dock-revision') === retainedDockChild &&
				retainedDockChild.superview === retainedDock &&
				String(retainedDockChild.stringValue) === 'Second revision' &&
				label === retainedLabel &&
				debug.findId('hmr-content') === retainedContent &&
				revision === retainedChild &&
				revision.superview === retainedContent &&
				Number(retainedContent.subviews.count) === 1 &&
				String(label.stringValue) === '1' &&
				String(revision.stringValue) === 'Second revision'
			) {
				root.unmount()
				if (
					retainedSegment.superview || retainedSegment.target != null || String(retainedSegment.action) !== '<null selector>' || Number(retainedSegment.segmentCount) !== 0 ||
					retainedProgress.superview ||
					retainedList.superview || retainedList.target != null || String(retainedList.action) !== '<null selector>' || Number(retainedList.numberOfItems) !== 0 ||
					retainedDate.superview || retainedDate.target != null || String(retainedDate.action) !== '<null selector>' ||
					retainedActivity.superview || !(Number(retainedActivity.alphaValue) === 0) ||
					retainedHtml.superview ||
					retainedFormatted.children.length ||
					retainedFormatted.parent ||
					retainedSearch.superview ||
					retainedSearch.delegate != null ||
					retainedSearch.target != null ||
					retainedRoot.superview ||
					retainedRootChild.superview ||
					retainedProxyChild.superview ||
					retainedProxy.children.length ||
					retainedWrap.superview ||
					retainedWrapChild.superview ||
					retainedContent.superview ||
					retainedChild.superview ||
					retainedDock.superview ||
					retainedDockChild.superview
				) {
					console.error('PACKED_HMR_FAIL: ContentView teardown retained views')
					return
				}

				console.log('PACKED_CONTENTVIEW_HMR_OK')
				console.log('PACKED_DOCKLAYOUT_HMR_OK')
				console.log('PACKED_WRAPLAYOUT_HMR_OK')
				console.log('PACKED_PROXYVIEWCONTAINER_HMR_OK')
				console.log('PACKED_ROOTLAYOUT_HMR_OK')
				console.log('PACKED_SEARCHBAR_HMR_OK')
				console.log('PACKED_FORMATTEDSTRING_HMR_OK')
				console.log('PACKED_ACTIVITYINDICATOR_HMR_OK')
				console.log('PACKED_SEGMENTEDBAR_HMR_OK')
				console.log('PACKED_PROGRESS_HMR_OK')
				console.log('PACKED_HTMLVIEW_HMR_OK')
				console.log('PACKED_LISTPICKER_HMR_OK')
				console.log('PACKED_DATEPICKER_HMR_OK')
				console.log('PACKED_HMR_OK')
			} else {
				console.error('PACKED_HMR_FAIL: view, state, or revised text differs')
			}
		}, 60)
	}
}

globalThis.__xplatDev = { reload }
globalThis.__xplatOnInput = (line: string) => {
	if (line === 'reload' && !reloaded) {
		reloaded = true
		reload()
	}
}

reload()
app.finishLaunching()
