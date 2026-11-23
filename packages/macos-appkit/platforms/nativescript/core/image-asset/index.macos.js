// macOS Core provider: ImageAsset — NSImage-backed, ported
// from image-asset/index.ios.js. `nativeImage` is the NSImage (or a path
// string resolves through it); getImageAsync honors options.width/height
// via getRequestedImageSize scaling on NSImage.size.
import { ImageAssetBase, getRequestedImageSize } from '@nativescript/core/image-asset/image-asset-common';
import { path as fsPath, knownFolders } from '@nativescript/core/file-system';
export * from '@nativescript/core/image-asset/image-asset-common';
export class ImageAsset extends ImageAssetBase {
    constructor(asset) {
        super();
        if (typeof asset === 'string') {
            if (asset.startsWith('~/')) {
                asset = fsPath.join(knownFolders.currentApp().path, asset.replace('~/', ''));
            }
            this.nativeImage = NSImage.alloc().initWithContentsOfFile(asset);
        }
        else if (asset && typeof asset === 'object' && asset.size !== undefined) {
            this.nativeImage = asset;
        }
        this.macos = this.nativeImage;
    }
    get ios() {
        return undefined;
    }
    getImageAsync(callback) {
        const image = this.nativeImage;
        if (!image) {
            callback(null, new Error('Asset cannot be found.'));
            return;
        }
        const rep = image.representations && image.representations.count > 0 ? image.representations.objectAtIndex(0) : null;
        const srcWidth = rep ? rep.pixelsWide : image.size.width;
        const srcHeight = rep ? rep.pixelsHigh : image.size.height;
        const requested = getRequestedImageSize({ width: srcWidth, height: srcHeight }, this.options);
        if (requested.width > 0 && requested.height > 0 && (requested.width !== image.size.width || requested.height !== image.size.height)) {
            image.size = { width: requested.width, height: requested.height };
        }
        callback(image, null);
    }
}
