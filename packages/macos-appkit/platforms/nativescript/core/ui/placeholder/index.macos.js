import { View } from '@nativescript/core/ui/core/view';

export * from '@nativescript/core/ui/placeholder/placeholder-common';

export class Placeholder extends View {
    static creatingViewEvent = 'creatingView';

    createNativeView() {
        const host = NSView.alloc().initWithFrame(CGRectMake(0, 0, 0, 0));
        this._host = host;
        const owner = this;
        this.notify({
            eventName: Placeholder.creatingViewEvent,
            object: host,
            context: this._context,
            get view() { return owner._content; },
            set view(content) {
                // Octane may dispatch the event after the mount batch completes.
                if (owner._host !== host || content === owner._content) {
                    return;
                }
                if (content != null && (!(content instanceof NSView) || content === host || content.superview)) {
                    throw new TypeError('AppKit Placeholder requires an unattached NSView');
                }
                owner._content?.removeFromSuperview();
                owner._content = undefined;
                if (content != null) {
                    content.frame = content.frameForAlignmentRect(host.bounds);
                    host.addSubview(content);
                    owner._content = content;
                }
            },
        });
        return host;
    }

    onLayout(left, top, right, bottom) {
        super.onLayout(left, top, right, bottom);
        const content = this._content;
        if (content) {
            content.frame = content.frameForAlignmentRect(this.nativeViewProtected.bounds);
        }
    }

    disposeNativeView() {
        try {
            this._content?.removeFromSuperview();
        }
        finally {
            this._content = undefined;
            this._host = undefined;
            super.disposeNativeView();
        }
    }
}
