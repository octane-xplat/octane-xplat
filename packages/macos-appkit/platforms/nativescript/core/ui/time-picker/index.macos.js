// macOS Core provider: TimePicker for AppKit — NSDatePicker
// (textFieldAndStepper, time mode) with target-action timeChange.
import { TimePickerBase, timeProperty, hourProperty, minuteProperty, minuteIntervalProperty, getValidTime } from '@nativescript/core/ui/time-picker/time-picker-common';
import { layout } from '@nativescript/core/utils';
export * from '@nativescript/core/ui/time-picker/time-picker-common';
const TimePickerTargetImpl = NSObject.extend({
    ['changed:'](sender) {
        const owner = this._weakOwner ? this._weakOwner.deref() : null;
        if (owner) {
            const value = sender.dateValue;
            const d = value ? new Date(value.timeIntervalSince1970 * 1000) : new Date(0);
            const time = getValidTime(owner, d.getHours(), d.getMinutes());
            let changed = false;
            if (time.hour !== owner.hour) {
                hourProperty.nativeValueChange(owner, time.hour);
                changed = true;
            }
            if (time.minute !== owner.minute) {
                minuteProperty.nativeValueChange(owner, time.minute);
                changed = true;
            }
            if (changed) {
                timeProperty.nativeValueChange(owner, new Date(0, 0, 0, time.hour, time.minute));
            }
        }
    },
}, {
    name: 'NSCoreMacosTimePickerTarget',
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
export class TimePicker extends TimePickerBase {
    nativeViewProtected;
    _target;
    createNativeView() {
        const picker = NSDatePicker.alloc().initWithFrame(CGRectMake(0, 0, 0, 0));
        picker.datePickerStyle = 1 /* NSDatePickerStyleTextFieldAndStepper */;
        picker.datePickerElements = 0x000c /* NSDatePickerElementFlagHourMinute */;
        return picker;
    }
    initNativeView() {
        super.initNativeView();
        this._target = TimePickerTargetImpl.new();
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
    [timeProperty.getDefault]() {
        return new Date(0);
    }
    [timeProperty.setNative](value) {
        const nv = this.nativeViewProtected;
        const ns = toNSDate(value);
        if (nv && ns)
            {nv.dateValue = ns;}
    }
    [hourProperty.getDefault]() { return this.time ? this.time.getHours() : 0; }
    [hourProperty.setNative](value) { this._mergeTime(value, undefined); }
    [minuteProperty.getDefault]() { return this.time ? this.time.getMinutes() : 0; }
    [minuteProperty.setNative](value) { this._mergeTime(undefined, value); }
    _mergeTime(hour, minute) {
        const t = this.time ? new Date(this.time.getTime()) : new Date(0, 0, 0, 0, 0);
        if (hour !== undefined)
            {t.setHours(hour);}
        if (minute !== undefined)
            {t.setMinutes(minute);}
        this.time = t;
    }
    [minuteIntervalProperty.getDefault]() {
        return 1;
    }
    [minuteIntervalProperty.setNative](value) {
        const nv = this.nativeViewProtected;
        if (nv && value > 0) {
            nv.minuteInterval = value;
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
