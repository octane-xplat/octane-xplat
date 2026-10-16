import type { NSArray, NSEdgeInsets, NSExtensionRequestHandling } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSViewController } from './AppKit'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const NCUpdateResult: {
	NewData: 0
	NoData: 1
	Failed: 2
}

export declare interface NCWidgetSearchViewDelegate extends NSObjectProtocol {
	widgetSearchSearchForTermMaxResults(
		controller: NCWidgetSearchViewController,
		searchTerm: string,
		max: number,
	): void

	widgetSearchTermCleared(controller: NCWidgetSearchViewController): void

	widgetSearchResultSelected(controller: NCWidgetSearchViewController, object: interop.Object): void
}

export declare class NCWidgetSearchViewDelegate
	extends NativeObject
	implements NCWidgetSearchViewDelegate {}

export declare interface NCWidgetListViewDelegate extends NSObjectProtocol {
	widgetListViewControllerForRow(list: NCWidgetListViewController, row: number): NSViewController

	widgetListPerformAddAction?(list: NCWidgetListViewController): void

	widgetListShouldReorderRow?(list: NCWidgetListViewController, row: number): boolean

	widgetListDidReorderRowToRow?(
		list: NCWidgetListViewController,
		row: number,
		newIndex: number,
	): void

	widgetListShouldRemoveRow?(list: NCWidgetListViewController, row: number): boolean

	widgetListDidRemoveRow?(list: NCWidgetListViewController, row: number): void
}

export declare class NCWidgetListViewDelegate
	extends NativeObject
	implements NCWidgetListViewDelegate {}

export declare interface NCWidgetProviding extends NSExtensionRequestHandling {
	widgetPerformUpdateWithCompletionHandler?(
		completionHandler: (p1: interop.Enum<typeof NCUpdateResult>) => void,
	): void

	widgetMarginInsetsForProposedMarginInsets?(defaultMarginInset: NSEdgeInsets): NSEdgeInsets

	readonly widgetAllowsEditing?: boolean

	widgetDidBeginEditing?(): void

	widgetDidEndEditing?(): void
}

export declare class NCWidgetProviding extends NativeObject implements NCWidgetProviding {}

export declare class NCWidgetListViewController extends NSViewController {
	delegate: NCWidgetListViewDelegate

	get contents(): NSArray
	set contents(value: NSArray<interop.Object> | Array<interop.Object>)

	minimumVisibleRowCount: number

	hasDividerLines: boolean

	editing: boolean

	showsAddButtonWhenEditing: boolean

	viewControllerAtRowMakeIfNecessary(row: number, makeIfNecesary: boolean): NSViewController

	rowForViewController(viewController: NSViewController): number
}

export declare class NCWidgetSearchViewController extends NSViewController {
	delegate: NCWidgetSearchViewDelegate

	get searchResults(): NSArray
	set searchResults(value: NSArray<interop.Object> | Array<interop.Object>)

	searchDescription: string

	searchResultsPlaceholderString: string

	searchResultKeyPath: string
}

export declare class NCWidgetController extends NSObject {
	static widgetController<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	static defaultWidgetController(): NCWidgetController

	setHasContentForWidgetWithBundleIdentifier(flag: boolean, bundleID: string): void
}
