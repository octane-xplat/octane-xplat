// macOS Core provider: DatePicker for AppKit — NSDatePicker
// (textFieldAndStepper, date mode) with target-action dateChange. On this
// bridge NSDate is an object handle — check capability, not callability.
import { DatePickerBase, dateProperty, minDateProperty, maxDateProperty, yearProperty, monthProperty, dayProperty, hourProperty, minuteProperty, secondProperty } from '@nativescript/core/ui/date-picker/date-picker-common';
import { layout } from '@nativescript/core/utils';
export * from '@nativescript/core/ui/date-picker/date-picker-common';
const DatePickerTargetImpl = NSObject.extend({
    ['changed:'](sender) {
        const owner = this._weakOwner ? this._weakOwner.deref() : null;
        if (owner) {
            const value = sender.dateValue;
            const date = value ? new Date(value.timeIntervalSince1970 * 1000) : new Date();
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
function toNSDate(date) {
    if (date == null)
        {return null;}
    const ms = date instanceof Date ? date.getTime() : new Date(date).getTime();
    if (isNaN(ms))
        {return null;}
    return NSDate.dateWithTimeIntervalSince1970(ms / 1000);
}
export class DatePicker extends DatePickerBase {
    nativeViewProtected;
    _target;
    createNativeView() {
        const picker = NSDatePicker.alloc().initWithFrame(CGRectMake(0, 0, 0, 0));
        picker.datePickerStyle = 1 /* NSDatePickerStyleTextFieldAndStepper */;
        picker.datePickerElements = 0x00e0 /* NSDatePickerElementFlagYearMonthDay */;
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
        super.disposeNativeView();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    [dateProperty.getDefault]() {
        return new Date();
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
    [minDateProperty.setNative](value) {
        const nv = this.nativeViewProtected;
        if (nv)
            {nv.minDate = toNSDate(value);}
    }
    [maxDateProperty.getDefault]() {
        return null;
    }
    [maxDateProperty.setNative](value) {
        const nv = this.nativeViewProtected;
        if (nv)
            {nv.maxDate = toNSDate(value);}
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
