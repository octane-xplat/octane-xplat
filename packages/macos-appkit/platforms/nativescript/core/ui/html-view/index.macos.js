// macOS Core provider: HtmlView for AppKit — non-editable,
// non-selectable NSTextView whose attributed string is imported from HTML
// via NSAttributedString initWithHTML. UTF-8 needs the explicit
// NSCharacterEncodingDocumentAttribute or Unicode mojibake results.
import { HtmlViewBase, htmlProperty } from '@nativescript/core/ui/html-view/html-view-common';
import { layout } from '@nativescript/core/utils';
export * from '@nativescript/core/ui/html-view/html-view-common';
export class HtmlView extends HtmlViewBase {
    nativeViewProtected;
    createNativeView() {
        const tv = NSTextView.alloc().initWithFrame(CGRectMake(0, 0, 0, 0));
        tv.editable = false;
        tv.selectable = false;
        tv.drawsBackground = false;
        tv.textContainerInset = { width: 0, height: 0 };
        return tv;
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    [htmlProperty.getDefault]() {
        return '';
    }
    [htmlProperty.setNative](value) {
        const nv = this.nativeViewProtected;
        if (!nv)
            {return;}
        const html = value == null ? '' : String(value);
        if (!html) {
            nv.string = '';
            return;
        }
        // AppKit's initWithHTML ignores NSCharacterEncodingDocumentAttribute —
        // UTF-8 bytes decode as Latin-1. Numeric entities are encoding-immune,
        // so escape everything outside ASCII before handing it data.
        const safe = html.replace(/[\u0080-\uFFFF]/g, (ch) => `&#x${ch.charCodeAt(0).toString(16)};`);
        const data = NSString.stringWithString(safe).dataUsingEncoding(NSUTF8StringEncoding);
        const options = NSDictionary.dictionaryWithObjectsForKeys(['NSHTMLTextDocumentType', NSUTF8StringEncoding], ['NSDocumentTypeDocumentAttribute', 'NSCharacterEncodingDocumentAttribute']);
        const attr = NSAttributedString.alloc().initWithHTMLOptionsDocumentAttributes(data, options, null);
        if (attr) {
            nv.textStorage.setAttributedString(attr);
        }
        else {
            nv.string = html;
        }
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const nv = this.nativeViewProtected;
        if (!nv)
            {return;}
        const width = layout.getMeasureSpecSize(widthMeasureSpec);
        const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);
        const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);
        let measuredWidth = width;
        if (widthMode !== layout.EXACTLY) {
            nv.textContainer.containerSize = { width: widthMode === layout.AT_MOST ? width : 0, height: 0 };
            nv.textContainer.widthTracksTextView = false;
            const lm = nv.layoutManager;
            const tc = nv.textContainer;
            if (lm && tc) {
                lm.ensureLayoutForTextContainer(tc);
                const used = lm.usedRectForTextContainer(tc).size;
                measuredWidth = Math.min(width, Math.max(used.width, 1));
            }
        }
        let measuredHeight = layout.getMeasureSpecSize(heightMeasureSpec);
        if (heightMode !== layout.EXACTLY) {
            nv.textContainer.containerSize = { width: measuredWidth, height: 0 };
            const lm = nv.layoutManager;
            const tc = nv.textContainer;
            if (lm && tc) {
                lm.ensureLayoutForTextContainer(tc);
                measuredHeight = lm.usedRectForTextContainer(tc).size.height || 1;
            }
        }
        this.setMeasuredDimension(measuredWidth, measuredHeight);
    }
}
