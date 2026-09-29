// Adapted from @expo/ui (MIT) — Copyright 2025-present 650 Industries.
// Upstream: expo/packages/expo-ui/ios/BottomSheetView.swift (sdk-57).
// The ExpoModules glue (@Field props record, EventDispatcher, children slot
// views) is replaced by the @nativescript/swift-ui provider contract:
// updateData(NSDictionary) + onEvent. The sheet's content is a registered
// NativeScript view resolved through NativeScriptViewFactory — the same
// HostedNativeScriptView the context-menu leaf re-declares (the plugin's
// NativeScriptView struct is module-internal).

import SwiftUI

private final class SheetModel: ObservableObject {
	@Published var isPresented: Bool = false
	@Published var contentId: String = ""
	@Published var fitToContents: Bool = false
	@Published var detents: [String] = ["medium"]
	@Published var customHeight: Double? = nil
	@Published var customFraction: Double? = nil
	@Published var showDragIndicator: Bool = false
	@Published var interactiveDismissDisabled: Bool = false
	var onPresentedChange: ((Bool) -> Void)?
	var onDismiss: (() -> Void)?
}

// Same shape as the plugin's NativeScriptViewRepresentable — unique instance
// id resolved through the core-owned NativeScriptViewFactory.
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

private struct SizePreferenceKey: PreferenceKey {
	static var defaultValue: CGSize?

	static func reduce(value: inout CGSize?, nextValue: () -> CGSize?) {
		guard let nextValue = nextValue() else {
			return
		}
		value = nextValue
	}
}

private struct ReadSizeModifier: ViewModifier {
	private var sizeView: some View {
		GeometryReader { geometry in
			Color.clear
				.preference(key: SizePreferenceKey.self, value: geometry.size)
				.allowsHitTesting(false)
		}
	}

	func body(content: Content) -> some View {
		content.background(sizeView)
	}
}

@available(iOS 14.0, *)
private struct SheetContent: View {
	@ObservedObject var model: SheetModel
	@State private var isPresented: Bool = false
	@State private var childrenSize: CGSize = .zero

	private func handleSizeChange(_ size: CGSize) {
		guard childrenSize != size else { return }
		childrenSize = size
	}

	@available(iOS 16.0, tvOS 16.0, *)
	private var presentationDetents: Set<PresentationDetent> {
		if model.fitToContents, childrenSize.height > 0 {
			return [.height(childrenSize.height)]
		}
		var result: Set<PresentationDetent> = []
		for detent in model.detents {
			switch detent {
			case "large": result.insert(.large)
			case "fraction": result.insert(.fraction(model.customFraction ?? 0.5))
			case "height": result.insert(.height(model.customHeight ?? 300))
			default: result.insert(.medium)
			}
		}
		return result.isEmpty ? [.medium] : result
	}

	var body: some View {
		Color.clear
			.frame(width: 0, height: 0)
			.sheet(isPresented: $isPresented, onDismiss: {
				model.onDismiss?()
			}) {
				let content = HostedNativeScriptView(id: model.contentId)
					.modifier(ReadSizeModifier())
					.onPreferenceChange(SizePreferenceKey.self) { size in
						if let size { handleSizeChange(size) }
					}
				if #available(iOS 16.0, tvOS 16.0, *) {
					content
						.presentationDetents(presentationDetents)
						.presentationDragIndicator(model.showDragIndicator ? .visible : .hidden)
						.interactiveDismissDisabled(model.interactiveDismissDisabled)
				} else {
					content
				}
			}
			.onChange(of: isPresented) { newIsPresented in
				if model.isPresented == newIsPresented {
					return
				}
				model.onPresentedChange?(newIsPresented)
			}
			.onChange(of: model.isPresented) { newValue in
				isPresented = newValue
			}
			.onAppear {
				isPresented = model.isPresented
			}
	}
}

@objc(XplatSheetProvider)
public final class XplatSheetProvider: UIViewController, SwiftUIProvider {
	private let model = SheetModel()

	public required init() {
		super.init(nibName: nil, bundle: nil)
		model.onPresentedChange = { [weak self] presented in
			self?.onEvent?(["isPresented": presented])
		}
		model.onDismiss = { [weak self] in
			self?.onEvent?(["dismissed": true])
		}
	}

	public required init?(coder: NSCoder) {
		super.init(coder: coder)
		model.onPresentedChange = { [weak self] presented in
			self?.onEvent?(["isPresented": presented])
		}
		model.onDismiss = { [weak self] in
			self?.onEvent?(["dismissed": true])
		}
	}

	public override func viewDidLoad() {
		super.viewDidLoad()
		if #available(iOS 14.0, *) {
			setupSwiftUIView(content: SheetContent(model: model))
		}
	}

	public func updateData(data: NSDictionary) {
		if let presented = data["isPresented"] as? NSNumber {
			model.isPresented = presented.boolValue
		}
		if let contentId = data["contentId"] as? String {
			model.contentId = contentId
		}
		if let fit = data["fitToContents"] as? NSNumber {
			model.fitToContents = fit.boolValue
		}
		if let detents = data["detents"] as? [String] {
			model.detents = detents
		}
		if let height = data["customHeight"] as? NSNumber {
			model.customHeight = height.doubleValue
		}
		if let fraction = data["customFraction"] as? NSNumber {
			model.customFraction = fraction.doubleValue
		}
		if let indicator = data["showDragIndicator"] as? NSNumber {
			model.showDragIndicator = indicator.boolValue
		}
		if let disable = data["interactiveDismissDisabled"] as? NSNumber {
			model.interactiveDismissDisabled = disable.boolValue
		}
	}

	public var onEvent: ((NSDictionary) -> Void)?
}
