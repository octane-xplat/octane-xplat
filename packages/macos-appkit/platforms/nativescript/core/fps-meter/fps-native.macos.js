// Borrowed from NativeScript/NativeScript PR #11089: packages/core/fps-meter/fps-native.macos.ts
export class FPSCallback {
    running = false;
    constructor(onFrame) {
        this.onFrame = onFrame;
        this.handle = null;
    }
    start() {
        if (this.running) {
            return;
        }
        this.running = true;
        this.handle = setInterval(() => {
            this.onFrame(Date.now());
        }, 16);
    }
    stop() {
        if (!this.running) {
            return;
        }
        this.running = false;
        clearInterval(this.handle);
        this.handle = null;
    }
}
