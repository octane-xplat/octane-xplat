// Adapted from @expo/ui (MIT) — Copyright 2025-present 650 Industries.
// Upstream: expo/packages/expo-ui/ios/DatePickerView.swift (sdk-57).
// The ExpoModules glue (@Field props record, EventDispatcher, Children label
// slot) is replaced by the @nativescript/swift-ui provider contract:
// updateData(NSDictionary) + onEvent. Children-as-label is not ported; the
// title string prop covers the label slot.

import SwiftUI

private final class DatePickerModel: ObservableObject {
	@Published var title: String? = nil
	@Published var selection: Date? = nil
	@Published var rangeStart: Date? = nil
	@Published var rangeEnd: Date? = nil
	@Published var displayedComponents: DatePicker.Components = [.date]
	@Published var pickerStyle: String = "automatic"
	@Published var disabled = false
	var onDateChange: ((Date) -> Void)?
}

private struct DatePickerContent: View {
	@ObservedObject var model: DatePickerModel
	@State private var date = Date()

	// `.graphical` has an AutoLayout bug (it uses UICalendarView under the
	// hood): it shrinks height when the user taps a date.
	// https://github.com/expo/expo/issues/47062
	// Fixed min width of 320 while the style is graphical.
	private var isGraphicalStyle: Bool {
		model.pickerStyle == "graphical"
	}

	var body: some View {
		styledPicker()
			.disabled(model.disabled)
			.frame(minWidth: isGraphicalStyle ? 320 : nil)
			.onChange(of: date) { newDate in
				if model.selection == newDate { return }
				model.onDateChange?(newDate)
			}
			.onChange(of: model.selection) { newValue in
				date = newValue ?? Date()
			}
			.onAppear {
				date = model.selection ?? Date()
			}
	}

	@ViewBuilder
	private func styledPicker() -> some View {
		switch model.pickerStyle {
		case "compact":
			createDatePicker().datePickerStyle(.compact)
		case "graphical":
			createDatePicker().datePickerStyle(.graphical)
		case "wheel":
			createDatePicker().datePickerStyle(.wheel)
		default:
			createDatePicker().datePickerStyle(.automatic)
		}
	}

	@ViewBuilder
	private func createDatePicker() -> some View {
		let components = model.displayedComponents
		let start = model.rangeStart
		let end = model.rangeEnd
		let title = model.title ?? ""

		let picker = Group {
			if let start, let end {
				DatePicker(title, selection: $date, in: start...end, displayedComponents: components)
			} else if let start {
				DatePicker(title, selection: $date, in: start..., displayedComponents: components)
			} else if let end {
				DatePicker(title, selection: $date, in: ...end, displayedComponents: components)
			} else {
				DatePicker(title, selection: $date, displayedComponents: components)
			}
		}

		if model.title == nil {
			picker.labelsHidden()
		} else {
			picker
		}
	}
}

@objc(XplatDatePickerProvider)
public final class XplatDatePickerProvider: UIViewController, SwiftUIProvider {
	private let model = DatePickerModel()

	public required init() {
		super.init(nibName: nil, bundle: nil)
		model.onDateChange = { [weak self] date in
			self?.onEvent?(["date": date.timeIntervalSince1970 * 1000])
		}
	}

	public required init?(coder: NSCoder) {
		super.init(coder: coder)
		model.onDateChange = { [weak self] date in
			self?.onEvent?(["date": date.timeIntervalSince1970 * 1000])
		}
	}

	public override func viewDidLoad() {
		super.viewDidLoad()
		setupSwiftUIView(content: DatePickerContent(model: model))
	}

	private static func millisToDate(_ value: Any?) -> Date? {
		guard let millis = value as? NSNumber else { return nil }
		return Date(timeIntervalSince1970: millis.doubleValue / 1000)
	}

	public func updateData(data: NSDictionary) {
		if let title = data["title"] as? String {
			model.title = title.isEmpty ? nil : title
		}
		if let selection = data["selection"] as? NSNumber {
			model.selection = Date(timeIntervalSince1970: selection.doubleValue / 1000)
		}
		if let range = data["range"] as? [String: Any] {
			model.rangeStart = Self.millisToDate(range["start"])
			model.rangeEnd = Self.millisToDate(range["end"])
		}
		if let components = data["displayedComponents"] as? [String] {
			var mapped: DatePicker.Components = []
			if components.contains("date") { mapped.insert(.date) }
			if components.contains("hourAndMinute") { mapped.insert(.hourAndMinute) }
			if !mapped.isEmpty { model.displayedComponents = mapped }
		}
		if let pickerStyle = data["pickerStyle"] as? String {
			model.pickerStyle = pickerStyle
		}
		if let disabled = data["disabled"] as? NSNumber {
			model.disabled = disabled.boolValue
		}
	}

	public var onEvent: ((NSDictionary) -> Void)?
}
