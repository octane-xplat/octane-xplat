// Adapted from @expo/ui (MIT) — Copyright 2025-present 650 Industries.
// Upstream: expo/packages/expo-ui/ios/ContextMenu/ContextMenu.swift (sdk-57).
// The ExpoModules glue (children slot views, EventDispatcher) is replaced by
// the @nativescript/swift-ui provider contract: the activation element is a
// UIViewRepresentable resolved by id from NativeScriptViewFactory (the same
// lookup the plugin's own NativeScriptView uses — re-declared here because
// the plugin's struct is module-internal), and menu content arrives as
// serialized item data through updateData(NSDictionary) + onEvent.

import SwiftUI

private struct ContextMenuItemSpec: Identifiable {
	let id: String
	let title: String
	let destructive: Bool
	let disabled: Bool
	let divider: Bool
}

private final class ContextMenuModel: ObservableObject {
	@Published var triggerId: String = ""
	@Published var previewId: String = ""
	@Published var items: [ContextMenuItemSpec] = []
	var onSelect: ((String) -> Void)?
}

// Same shape as the plugin's NativeScriptViewRepresentable: a unique
// instance id (registered id + uuid) resolved through the core-owned
// NativeScriptViewFactory, which the JS-side SwiftUIManager hooks up.
private struct HostedNativeScriptView: UIViewRepresentable {
	let id: String

	init(id: String) {
		self.id = id + "-" + UUID().uuidString
	}

	func makeUIView(context: Context) -> UIView {
		return NativeScriptViewFactory.shared?.getViewById(id) ?? UIView()
	}

	func updateUIView(_ uiView: UIView, context: Context) {}
}

@available(iOS 14.0, *)
private struct ContextMenuContent: View {
	@ObservedObject var model: ContextMenuModel

	private var menuItems: some View {
		ForEach(model.items) { item in
			if item.divider {
				Divider()
			}
			Button(role: item.destructive ? .destructive : nil) {
				model.onSelect?(item.id)
			} label: {
				Text(item.title)
			}
			.disabled(item.disabled)
		}
	}

	var body: some View {
		if model.triggerId.isEmpty {
			EmptyView()
		} else if #available(iOS 16.0, tvOS 16.0, *), !model.previewId.isEmpty {
			HostedNativeScriptView(id: model.triggerId)
				.contextMenu(menuItems: { menuItems }, preview: {
					HostedNativeScriptView(id: model.previewId)
				})
		} else {
			HostedNativeScriptView(id: model.triggerId)
				.contextMenu(menuItems: { menuItems })
		}
	}
}

@objc(XplatContextMenuProvider)
public final class XplatContextMenuProvider: UIViewController, SwiftUIProvider {
	private let model = ContextMenuModel()

	public required init() {
		super.init(nibName: nil, bundle: nil)
		model.onSelect = { [weak self] id in
			self?.onEvent?(["item": id])
		}
	}

	public required init?(coder: NSCoder) {
		super.init(coder: coder)
		model.onSelect = { [weak self] id in
			self?.onEvent?(["item": id])
		}
	}

	public override func viewDidLoad() {
		super.viewDidLoad()
		if #available(iOS 14.0, *) {
			setupSwiftUIView(content: ContextMenuContent(model: model))
		}
	}

	public func updateData(data: NSDictionary) {
		if let triggerId = data["triggerId"] as? String {
			model.triggerId = triggerId
		}
		if let previewId = data["previewId"] as? String {
			model.previewId = previewId
		}
		if let items = data["items"] as? [NSDictionary] {
			model.items = items.map { raw in
				ContextMenuItemSpec(
					id: raw["id"] as? String ?? "",
					title: raw["title"] as? String ?? "",
					destructive: (raw["destructive"] as? NSNumber)?.boolValue ?? false,
					disabled: (raw["disabled"] as? NSNumber)?.boolValue ?? false,
					divider: (raw["divider"] as? NSNumber)?.boolValue ?? false,
				)
			}
		}
	}

	public var onEvent: ((NSDictionary) -> Void)?
}
