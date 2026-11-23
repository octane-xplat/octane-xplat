// macOS Core provider: DatePicker for AppKit — NSDatePicker
// (textFieldAndStepper, date mode) with target-action dateChange. On this
// bridge NSDate is an object handle — check capability, not callability.
import { DatePickerBase, dateProperty, minDateProperty, maxDateProperty, yearProperty, monthProperty, dayProperty, hourProperty, minuteProperty, secondProperty } from '@nativescript/core/ui/date-picker/date-picker-common';
import { layout } from '@nativescript/core/utils';
import { unsetValue } from '@nativescript/core/ui/core/properties';
import { isEnabledProperty } from '@nativescript/core/ui/core/view';
import { NSDatePickerElementFlags, NSDatePickerMode, NSDatePickerStyle } from '@octane-xplat/platform/macos';
export * from '@nativescript/core/ui/date-picker/date-picker-common';
const DatePickerTargetImpl = NSObject.extend({
    ['changed:'](sender) {
        const owner = this._weakOwner ? this._weakOwner.deref() : null;
        if (owner?.isEnabled && sender === owner.nativeViewProtected && sender.dateValue) {
            const value = sender.dateValue;
            const date = calendarDate(value.timeIntervalSince1970 * 1000);
            sender.dateValue = toNSDate(date);
            let changed = false;
            if (date.getFullYear() !== owner.year) {
                yearProperty.nativeValueChange(owner, date.getFullYear());
                changed = true;
            }
            if (date.getMonth() + 1 !== owner.month) {
                monthProperty.nativeValueChange(owner, date.getMonth() + 1);
                changed = true;
            }
            if (date.getDate() !== owner.day) {
                dayProperty.nativeValueChange(owner, date.getDate());
                changed = true;
            }
            if (date.getHours() !== owner.hour) {
                hourProperty.nativeValueChange(owner, date.getHours());
                changed = true;
            }
            if (date.getMinutes() !== owner.minute) {
                minuteProperty.nativeValueChange(owner, date.getMinutes());
                changed = true;
            }
            if (date.getSeconds() !== owner.second) {
                secondProperty.nativeValueChange(owner, date.getSeconds());
                changed = true;
            }
            if (changed) {
                dateProperty.nativeValueChange(owner, date); // auto-fires 'dateChange'
            }
        }
    },
}, {
    name: 'NSCoreMacosDatePickerTarget',
    exposedMethods: { 'changed:': { returns: interop.types.void, params: [interop.types.id] } },
});
function calendarDate(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    if (!Number.isFinite(date.getTime())) {
        throw new Error('AppKit datepicker requires a valid date');
    }
    return date;
}

const defaultDate = calendarDate(new Date());

function toNSDate(date) {
    return date == null ? null : NSDate.dateWithTimeIntervalSince1970(calendarDate(date).getTime() / 1000);
}
export class DatePicker extends DatePickerBase {
    nativeViewProtected;
    _target;
    get date() {
        return dateProperty.isSet(this) ? super.date : defaultDate;
    }
    set date(value) {
        super.date = value == null || value === unsetValue ? defaultDate : calendarDate(value);
    }
    createNativeView() {
        const picker = NSDatePicker.alloc().initWithFrame(CGRectMake(0, 0, 0, 0));
        picker.datePickerStyle = NSDatePickerStyle.TextFieldAndStepper;
        picker.datePickerElements = NSDatePickerElementFlags.YearMonthDay;
        picker.datePickerMode = NSDatePickerMode.Single;
        picker.bezeled = true;
        picker.drawsBackground = true;
        picker.dateValue = toNSDate(defaultDate);
        return picker;
    }
    initNativeView() {
        super.initNativeView();
        this._target = DatePickerTargetImpl.new();
        this._target._weakOwner = new WeakRef(this);
        this.nativeViewProtected.target = this._target;
        this.nativeViewProtected.action = NSSelectorFromString('changed:');
    }
    disposeNativeView() {
        const nv = this.nativeViewProtected;
        if (nv) {
            nv.target = null;
            nv.action = null;
        }
        if (this._target) {
            this._target._weakOwner = undefined;
            this._target = undefined;
        }
        super.disposeNativeView();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    [isEnabledProperty.getDefault]() {
        return true;
    }
    [isEnabledProperty.setNative](value) {
        this.nativeViewProtected.enabled = value;
    }
    [dateProperty.getDefault]() {
        return defaultDate;
    }
    [dateProperty.setNative](value) {
        const nv = this.nativeViewProtected;
        const ns = toNSDate(value);
        if (nv && ns)
            {nv.dateValue = ns;}
    }
    [yearProperty.getDefault]() { return this.date ? this.date.getFullYear() : 0; }
    [yearProperty.setNative](value) { this._mergeDate({ year: value }); }
    [monthProperty.getDefault]() { return this.date ? this.date.getMonth() + 1 : 0; }
    [monthProperty.setNative](value) { this._mergeDate({ month: value - 1 }); }
    [dayProperty.getDefault]() { return this.date ? this.date.getDate() : 0; }
    [dayProperty.setNative](value) { this._mergeDate({ day: value }); }
    [hourProperty.getDefault]() { return this.date ? this.date.getHours() : 0; }
    [hourProperty.setNative](value) { this._mergeDate({ hour: value }); }
    [minuteProperty.getDefault]() { return this.date ? this.date.getMinutes() : 0; }
    [minuteProperty.setNative](value) { this._mergeDate({ minute: value }); }
    [secondProperty.getDefault]() { return this.date ? this.date.getSeconds() : 0; }
    [secondProperty.setNative](value) { this._mergeDate({ second: value }); }
    _mergeDate(part) {
        const d = this.date ? new Date(this.date.getTime()) : new Date();
        if (part.year !== undefined)
            {d.setFullYear(part.year);}
        if (part.month !== undefined)
            {d.setMonth(part.month);}
        if (part.day !== undefined)
            {d.setDate(part.day);}
        if (part.hour !== undefined)
            {d.setHours(part.hour);}
        if (part.minute !== undefined)
            {d.setMinutes(part.minute);}
        if (part.second !== undefined)
            {d.setSeconds(part.second);}
        this.date = d;
    }
    [minDateProperty.getDefault]() {
        return null;
    }
    [minDateProperty.setNative]() {
        this._syncBounds();
    }
    [maxDateProperty.getDefault]() {
        return null;
    }
    [maxDateProperty.setNative]() {
        this._syncBounds();
    }
    _syncBounds() {
        const nv = this.nativeViewProtected;
        if (nv) {
            nv.minDate = null;
            nv.maxDate = null;
            nv.minDate = toNSDate(this.minDate);
            nv.maxDate = toNSDate(this.maxDate);
            nv.dateValue = toNSDate(this.date);
        }
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const nv = this.nativeViewProtected;
        if (nv) {
            const width = layout.getMeasureSpecSize(widthMeasureSpec);
            const fit = nv.fittingSize;
            this.setMeasuredDimension(Math.max(width, fit.width), Math.max(fit.height, 22));
        }
    }
}
