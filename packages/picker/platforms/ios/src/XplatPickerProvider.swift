import SwiftUI

private struct PickerOption: Identifiable {
	let value: String
	let label: String
	let disabled: Bool

	var id: String { value }
}

private final class PickerModel: ObservableObject {
	@Published var label = ""
	@Published var accessibilityLabel = ""
	@Published var value = ""
	@Published var disabled = false
	@Published var options: [PickerOption] = []
	var onValueChange: ((String) -> Void)?
}

private struct PickerContent: View {
	@ObservedObject var model: PickerModel

	var body: some View {
		Picker(model.label, selection: Binding(
			get: { model.value },
			set: { nextValue in
				model.value = nextValue
				model.onValueChange?(nextValue)
			},
		)) {
			ForEach(model.options) { option in
				Text(option.label)
					.tag(option.value)
					.disabled(option.disabled)
			}
		}
		.pickerStyle(.menu)
		.disabled(model.disabled)
		.accessibilityLabel(model.accessibilityLabel)
		.background(Color.clear)
	}
}

@objc(XplatPickerProvider)
public final class XplatPickerProvider: UIViewController, SwiftUIProvider {
	private let model = PickerModel()

	public required init() {
		super.init(nibName: nil, bundle: nil)
		model.onValueChange = { [weak self] value in
			self?.onEvent?(["value": value])
		}
	}

	public required init?(coder: NSCoder) {
		super.init(coder: coder)
		model.onValueChange = { [weak self] value in
			self?.onEvent?(["value": value])
		}
	}

	public override func viewDidLoad() {
		super.viewDidLoad()
		setupSwiftUIView(content: PickerContent(model: model))
	}

	public func updateData(data: NSDictionary) {
		if let label = data["label"] as? String { model.label = label }
		if let accessibilityLabel = data["accessibilityLabel"] as? String {
			model.accessibilityLabel = accessibilityLabel
		}
		if let value = data["value"] as? String { model.value = value }
		if let disabled = data["disabled"] as? NSNumber { model.disabled = disabled.boolValue }
		if let options = data["options"] as? [[String: Any]] {
			model.options = options.compactMap { option in
				guard let value = option["value"] as? String,
					let label = option["label"] as? String
				else { return nil }

				return PickerOption(
					value: value,
					label: label,
					disabled: (option["disabled"] as? NSNumber)?.boolValue ?? false,
				)
			}
		}
	}

	public var onEvent: ((NSDictionary) -> Void)?
}
