// Borrowed from NativeScript/NativeScript PR #11089: packages/core/platform/screen/index.macos.ts
class MainScreen {
    get screen() {
        if (NSScreen.mainScreen) {
            return NSScreen.mainScreen;
        }
        const screens = NSScreen.screens;
        return screens && screens.count > 0 ? screens.objectAtIndex(0) : null;
    }
    get widthPixels() {
        return this.widthDIPs * this.scale;
    }
    get heightPixels() {
        return this.heightDIPs * this.scale;
    }
    get scale() {
        return this.screen ? this.screen.backingScaleFactor : 1;
    }
    get widthDIPs() {
        return this.screen ? this.screen.frame.size.width : 0;
    }
    get heightDIPs() {
        return this.screen ? this.screen.frame.size.height : 0;
    }
    _updateMetrics() { }
}
export class Screen {
    static mainScreen = new MainScreen();
}
export const screen = Screen;
