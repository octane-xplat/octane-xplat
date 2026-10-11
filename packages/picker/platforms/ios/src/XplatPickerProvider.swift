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
		let options = ((data["options"] as? [[String: Any]]) ?? []).compactMap { option -> PickerOption? in
			guard let value = option["value"] as? String,
				let label = option["label"] as? String
			else { return nil }

			return PickerOption(
				value: value,
				label: label,
				disabled: (option["disabled"] as? NSNumber)?.boolValue ?? false,
			)
		}

		// Full replace — matching the Kotlin provider: absent keys reset to
		// defaults and a missing value falls back to the first option, so a
		// partial payload cannot leave divergent state across platforms.
		model.label = data["label"] as? String ?? ""
		model.accessibilityLabel = data["accessibilityLabel"] as? String ?? ""
		model.value = data["value"] as? String ?? options.first?.value ?? ""
		model.disabled = (data["disabled"] as? NSNumber)?.boolValue ?? false
		model.options = options
	}

	public var onEvent: ((NSDictionary) -> Void)?
}
