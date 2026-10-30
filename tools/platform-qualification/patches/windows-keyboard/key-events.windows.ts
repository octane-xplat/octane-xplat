import { subscribeNativeEvent } from '../../gestures/pointer-events.windows';
const handledKeys = new WeakSet<object>();
/** Consume only a key explicitly handled by this bridge, preserving legacy submit. */
export function takeWindowsKeyHandled(args: object): boolean {
    const handled = handledKeys.has(args);
    handledKeys.delete(args);
    return handled;
}
/** Raw Windows key events. The UI adapter owns portable key normalization. */
export function createWindowsKeyEvents(view: any): {
    sync(): void;
    release(): void;
} {
    const ref = new WeakRef(view);
    let enabled = true;
    const channels = new Map<string, {
        native: any;
        active: boolean;
        off(): void;
    }>();
    const drop = (name: string) => {
        const channel = channels.get(name);
        if (!channel)
            return;
        channel.active = false;
        channels.delete(name);
        channel.off();
    };
    const release = () => {
        enabled = false;
        const errors: unknown[] = [];
        for (const name of Array.from(channels.keys())) {
            try {
                drop(name);
            }
            catch (error) {
                errors.push(error);
            }
        }
        if (errors.length)
            throw new AggregateError(errors, 'Windows key event cleanup failed');
    };
    const refresh = () => {
        const owner = ref.deref();
        const native = enabled && owner?.isLoaded ? owner.nativeViewProtected : null;
        const added: string[] = [];
        try {
            for (const [name, nativeName] of [['keyDown', 'KeyDown'], ['keyUp', 'KeyUp']]) {
                const wanted = !!native && owner.hasListeners(name);
                const current = channels.get(name);
                if (current && (!wanted || current.native !== native))
                    drop(name);
                if (!wanted || channels.has(name))
                    continue;
                const channel = { native, active: true, off: () => { } };
                channels.set(name, channel);
                added.push(name);
                const off = subscribeNativeEvent(native, nativeName, (sender, args) => {
                    const target = ref.deref();
                    if (!channel.active || !target?.isLoaded || target.nativeViewProtected !== native || target.isEnabled === false || native.IsEnabled === false || !target.hasListeners(name))
                        return;
                    const event = args ?? sender;
                    const wasHandled = !!event.Handled;
                    handledKeys.delete(event);
                    try {
                        target.notify({ eventName: name, object: target, nativeEvent: event, preventDefault() {
                                event.Handled = true;
                                handledKeys.add(event);
                            } });
                    }
                    finally {
                        if (!wasHandled && event.Handled)
                            handledKeys.add(event);
                        // Observable removes once-handlers internally, without calling off().
                        refresh();
                    }
                }, null, (handler) => NSWinRT.asDelegate('Microsoft.UI.Xaml.Input.KeyEventHandler', handler), 1);
                channel.off = off;
                if (!channel.active)
                    off();
            }
        }
        catch (error) {
            const errors: unknown[] = [error];
            for (const name of added.reverse()) {
                try {
                    drop(name);
                }
                catch (cleanup) {
                    errors.push(cleanup);
                }
            }
            if (errors.length > 1)
                throw new AggregateError(errors, 'Windows key event binding failed');
            throw error;
        }
    };
    return { sync() { enabled = true; refresh(); }, release };
}
