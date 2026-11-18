import UIKit
import MasonCore

// Diagnostic only: compile against this SDK's named layout constants. The IR
// never contains these offsets, the buffer layout, or native pointers.
extension UIView {
    @objc var prerenderLayoutValues: [String: Any] {
        let data = NSCMason.shared.styleForView(self).values
        precondition(data.length == StyleKeys.STYLE_BUFFER_SIZE)
        func byte(_ offset: Int) -> Int { Int(data.bytes.load(fromByteOffset: offset, as: UInt8.self)) }
        func float(_ offset: Int) -> Float { data.bytes.loadUnaligned(fromByteOffset: offset, as: Float.self) }
        func length(_ type: Int, _ value: Int, auto: Bool = false) -> [NSNumber] {
            let tag = byte(type), number = auto && tag == 0 ? 0 : float(value)
            precondition(number.isFinite)
            return [NSNumber(value: tag), NSNumber(value: number)]
        }
        var result: [String: Any] = [
            "display":byte(StyleKeys.DISPLAY), "flexDirection":byte(StyleKeys.FLEX_DIRECTION),
            "flexGrow":float(StyleKeys.FLEX_GROW), "flexShrink":float(StyleKeys.FLEX_SHRINK),
            "alignItems":byte(StyleKeys.ALIGN_ITEMS), "justifyContent":byte(StyleKeys.JUSTIFY_CONTENT),
            "alignSelf":byte(StyleKeys.ALIGN_SELF), "justifySelf":byte(StyleKeys.JUSTIFY_SELF),
            "gridRowStart":length(StyleKeys.GRID_ROW_START_TYPE, StyleKeys.GRID_ROW_START_VALUE),
            "gridRowEnd":length(StyleKeys.GRID_ROW_END_TYPE, StyleKeys.GRID_ROW_END_VALUE),
            "gridColumnStart":length(StyleKeys.GRID_COLUMN_START_TYPE, StyleKeys.GRID_COLUMN_START_VALUE),
            "gridColumnEnd":length(StyleKeys.GRID_COLUMN_END_TYPE, StyleKeys.GRID_COLUMN_END_VALUE),
            "paddingTop":length(StyleKeys.PADDING_TOP_TYPE, StyleKeys.PADDING_TOP_VALUE),
            "paddingRight":length(StyleKeys.PADDING_RIGHT_TYPE, StyleKeys.PADDING_RIGHT_VALUE),
            "paddingBottom":length(StyleKeys.PADDING_BOTTOM_TYPE, StyleKeys.PADDING_BOTTOM_VALUE),
            "paddingLeft":length(StyleKeys.PADDING_LEFT_TYPE, StyleKeys.PADDING_LEFT_VALUE),
            "rowGap":length(StyleKeys.GAP_ROW_TYPE, StyleKeys.GAP_ROW_VALUE),
            "columnGap":length(StyleKeys.GAP_COLUMN_TYPE, StyleKeys.GAP_COLUMN_VALUE),
            "height":length(StyleKeys.HEIGHT_TYPE, StyleKeys.HEIGHT_VALUE, auto:true),
            "minWidth":length(StyleKeys.MIN_WIDTH_TYPE, StyleKeys.MIN_WIDTH_VALUE, auto:true),
            "maxWidth":length(StyleKeys.MAX_WIDTH_TYPE, StyleKeys.MAX_WIDTH_VALUE, auto:true),
            "borderTopWidth":length(StyleKeys.BORDER_TOP_TYPE, StyleKeys.BORDER_TOP_VALUE),
            "borderRightWidth":length(StyleKeys.BORDER_RIGHT_TYPE, StyleKeys.BORDER_RIGHT_VALUE),
            "borderBottomWidth":length(StyleKeys.BORDER_BOTTOM_TYPE, StyleKeys.BORDER_BOTTOM_VALUE),
            "borderLeftWidth":length(StyleKeys.BORDER_LEFT_TYPE, StyleKeys.BORDER_LEFT_VALUE),
        ]
        if let label = self as? UILabel {
            result["numberOfLines"] = label.numberOfLines
            result["lineBreakMode"] = label.lineBreakMode.rawValue
            result["userInteractionEnabled"] = label.isUserInteractionEnabled
        }
        return result
    }
    @objc var prerenderEffectiveRadii: [NSNumber] {
        let data = NSCMason.shared.styleForView(self).values
        precondition(data.length == StyleKeys.STYLE_BUFFER_SIZE)
        let corners = [
            [StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE, StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE, StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE, StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE, StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT],
            [StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT],
            [StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT],
            [StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT],
        ]
        return corners.flatMap { offsets in offsets.enumerated().map { index, offset in
            precondition(offset + (index < 2 ? 1 : 4) <= data.length)
            return index < 2 ? NSNumber(value: data.bytes.load(fromByteOffset: offset, as: UInt8.self)) : NSNumber(value: data.bytes.loadUnaligned(fromByteOffset: offset, as: Float.self))
        } }
    }
}

