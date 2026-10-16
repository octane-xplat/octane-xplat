import '@nativescript/macos-node-api'
import * as renderer from '@octane-xplat/macos-renderer'
import * as native from 'octane/universal/native'
import * as signals from 'octane/signals'
import * as signalClient from 'octane/signals/client'
import * as internal from 'octane/internal/client'
import { NSApplication, NSView } from '@octane-xplat/platform/macos'

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
let retainedListView: any
let retainedListViewCell: any
let retainedListViewLabel: any
let retainedListViewTable: any
let retainedItem: any
let retainedItemBar: any
let retainedTabs: any
let retainedTabItem: any
let retainedTabContent: any
let retainedSegment: any
let retainedProgress: any
let retainedList: any
let retainedTime: any
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
let retainedPlaceholder: any
let retainedPlaceholderContent: any
let reloaded = false
function reload() {
	const loaded = __hostRunFile(process.env.OCTANE_MACOS_DEV_BUNDLE!)
	if (!liveComponent) {
		liveComponent = native.hmrUniversalComponent('macos', loaded.default ?? loaded)
		root.render(liveComponent, {})
		setTimeout(() => {
			retainedListView = debug.findId('hmr-listview')
			retainedListViewTable = retainedListView.documentView
			retainedListViewCell = retainedListViewTable.viewAtColumnRowMakeIfNecessary(0, 0, true)
			retainedItem = debug.findId('hmr-item')
			retainedItemBar = debug.findId('hmr-item-bar')
			retainedTabs = debug.findId('hmr-tabs')
			retainedTabItem = debug.findId('hmr-tab-item')
			retainedTabContent = debug.findId('hmr-tab-content')
			retainedSegment = debug.findId('hmr-segment')
			retainedProgress = debug.findId('hmr-progress')
			retainedList = debug.findId('hmr-list')
			retainedTime = debug.findId('hmr-time')
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
			retainedPlaceholder = debug.findId('hmr-placeholder')
			retainedPlaceholderContent = retainedPlaceholder.subviews.objectAtIndex(0)
			debug.pressId('increment')
			setTimeout(() => {
				if (Number(retainedActivity.alphaValue) === 0) {
					console.error('PACKED_HMR_FAIL: busy signal did not start spinner')
				}

				if (Number(retainedProgress.doubleValue) !== 25) {
					console.error('PACKED_HMR_FAIL: Progress signal did not update bar')
				}

				retainedListViewLabel = retainedListViewCell.subviews.objectAtIndex(0)
				console.log('HMR_CONSUMER_READY')
			}, 60)
		}, 60)
	} else {
		liveComponent[native.UNIVERSAL_HMR].update(loaded.default ?? loaded)
		setTimeout(() => {
			const label = debug.findId('count')
			const revision = debug.findId('revision')
			if (
				debug.findId('hmr-listview') === retainedListView &&
				retainedListView.documentView === retainedListViewTable &&
				retainedListViewCell.subviews.objectAtIndex(0) === retainedListViewLabel &&
				String(retainedListViewLabel.stringValue) === 'Second revision1' &&
				debug.findId('hmr-item') === retainedItem &&
				retainedItem.view === null &&
				retainedItem.props.title === 'Second revision' &&
				debug.findId('hmr-item-bar') === retainedItemBar &&
				String(retainedItemBar.labelForSegment(0)) === 'Second revision' &&
				String(retainedItemBar.labelForSegment(1)) === '1' &&
				Number(retainedItemBar.selectedSegment) === 1 &&
				debug.findId('hmr-tabs') === retainedTabs &&
				debug.findId('hmr-tab-item') === retainedTabItem &&
				debug.findId('hmr-tab-content') === retainedTabContent &&
				String(retainedTabContent.stringValue) === 'Second revision' &&
				String(retainedTabs.tabViewItemAtIndex(0).label) === 'Second revision' &&
				retainedTabs.selectedTabViewItem === retainedTabs.tabViewItemAtIndex(1) &&
				debug.findId('hmr-segment') === retainedSegment &&
				Number(retainedSegment.selectedSegment) === 1 &&
				String(retainedSegment.labelForSegment(0)) === 'Second revision' &&
				debug.findId('hmr-progress') === retainedProgress &&
				!retainedProgress.indeterminate &&
				Number(retainedProgress.doubleValue) === 40 &&
				Number(retainedProgress.maxValue) === 100 &&
				debug.findId('hmr-list') === retainedList &&
				Number(retainedList.indexOfSelectedItem) === 1 &&
				String(retainedList.itemAtIndex(0).title) === 'Second revision' &&
				debug.findId('hmr-time') === retainedTime &&
				new Date(Number(retainedTime.dateValue.timeIntervalSince1970) * 1000).getTime() ===
					new Date(0, 0, 0, 13, 35).getTime() &&
				debug.findId('hmr-date') === retainedDate &&
				new Date(Number(retainedDate.dateValue.timeIntervalSince1970) * 1000).getDate() === 13 &&
				new Date(Number(retainedDate.dateValue.timeIntervalSince1970) * 1000).getHours() === 0 &&
				debug.findId('hmr-activity') === retainedActivity &&
				Number(retainedActivity.alphaValue) === 0 &&
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
				debug.findId('hmr-placeholder') === retainedPlaceholder &&
				retainedPlaceholderContent.superview === retainedPlaceholder &&
				String(retainedPlaceholderContent.stringValue) === 'First revision' &&
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
					retainedListView.superview ||
					retainedListView.documentView != null ||
					retainedListViewTable.delegate != null ||
					retainedListViewTable.target != null ||
					retainedListViewLabel.superview ||
					retainedItem.parent ||
					retainedItem.props.title !== undefined ||
					retainedItemBar.superview ||
					Number(retainedItemBar.segmentCount) !== 0 ||
					retainedSegment.superview ||
					retainedSegment.target != null ||
					String(retainedSegment.action) !== '<null selector>' ||
					Number(retainedSegment.segmentCount) !== 0 ||
					retainedProgress.superview ||
					retainedList.superview ||
					retainedList.target != null ||
					String(retainedList.action) !== '<null selector>' ||
					Number(retainedList.numberOfItems) !== 0 ||
					retainedTime.superview ||
					retainedTime.target != null ||
					String(retainedTime.action) !== '<null selector>' ||
					retainedDate.superview ||
					retainedDate.target != null ||
					String(retainedDate.action) !== '<null selector>' ||
					retainedActivity.superview ||
					!(Number(retainedActivity.alphaValue) === 0) ||
					retainedHtml.superview ||
					retainedFormatted.children.length ||
					retainedFormatted.parent ||
					retainedSearch.superview ||
					retainedSearch.delegate != null ||
					retainedSearch.target != null ||
					retainedTabs.superview ||
					retainedTabs.numberOfTabViewItems ||
					retainedTabItem.contentRoot ||
					retainedTabContent.superview ||
					retainedRoot.superview ||
					retainedRootChild.superview ||
					retainedProxyChild.superview ||
					retainedProxy.children.length ||
					retainedWrap.superview ||
					retainedWrapChild.superview ||
					retainedContent.superview ||
					retainedChild.superview ||
					retainedDock.superview ||
					retainedDockChild.superview ||
					retainedPlaceholder.superview ||
					retainedPlaceholderContent.superview
				) {
					console.error('PACKED_HMR_FAIL: ContentView teardown retained views')
					return
				}

				console.log('PACKED_CONTENTVIEW_HMR_OK')
				console.log('PACKED_DOCKLAYOUT_HMR_OK')
				console.log('PACKED_WRAPLAYOUT_HMR_OK')
				console.log('PACKED_PROXYVIEWCONTAINER_HMR_OK')
				console.log('PACKED_PLACEHOLDER_HMR_OK')
				console.log('PACKED_ROOTLAYOUT_HMR_OK')
				console.log('PACKED_SEARCHBAR_HMR_OK')
				console.log('PACKED_FORMATTEDSTRING_HMR_OK')
				console.log('PACKED_ACTIVITYINDICATOR_HMR_OK')
				console.log('PACKED_SEGMENTEDBAR_HMR_OK')
				console.log('PACKED_SEGMENTEDBARITEM_HMR_OK')
				console.log('PACKED_PROGRESS_HMR_OK')
				console.log('PACKED_HTMLVIEW_HMR_OK')
				console.log('PACKED_LISTPICKER_HMR_OK')
				console.log('PACKED_TIMEPICKER_HMR_OK')
				console.log('PACKED_TABVIEW_HMR_OK')
				console.log('PACKED_DATEPICKER_HMR_OK')
				console.log('PACKED_LISTVIEW_HMR_OK')
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
