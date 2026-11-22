// macOS Core provider: ImageSource backed by NSImage, ported
// from image-source/index.ios.js. width/height report PIXELS (the best
// representation's pixelsWide/pixelsHigh, falling back to NSImage.size) to
// match iOS, whose UIImage.size is already point-size ~ pixel-size at
// scale 1 but whose consumers want raster dims.
import { path as fsPath, knownFolders } from '@nativescript/core/file-system';
import { requestInternal as httpRequest } from '@nativescript/core/http/http-request-internal';
import { isFileOrResourcePath, RESOURCE_PREFIX } from '@nativescript/core/utils';
import { Trace } from '@nativescript/core/trace';
export { isFileOrResourcePath };
// NSBitmapImageFileType — the bridge does not expose the enum name.
const FILE_TYPES = {
    png: 4, // NSBitmapImageFileTypePNG
    jpeg: 3, // NSBitmapImageFileTypeJPEG
    jpg: 3,
};
function getFileName(path) {
    let fileName = typeof path === 'string' ? path.trim() : '';
    if (fileName.indexOf('~/') === 0) {
        fileName = fsPath.join(knownFolders.currentApp().path, fileName.replace('~/', ''));
    }
    return fileName;
}
function bestRepresentation(image) {
    const reps = image?.representations;
    if (reps && reps.count > 0) {
        return reps.objectAtIndex(0);
    }
    return null;
}
function bitmapRep(image) {
    const tiff = image?.TIFFRepresentation;
    if (!tiff) {
        return null;
    }
    return NSBitmapImageRep.imageRepWithData(tiff);
}
function getImageData(image, format, quality = 0.9) {
    const rep = bitmapRep(image);
    const type = FILE_TYPES[(format || 'png').toLowerCase()];
    if (!rep || type == null) {
        return null;
    }
    const props = NSDictionary.dictionaryWithObjectForKey(quality, 'NSImageCompressionFactor');
    return rep.representationUsingTypeProperties(type, props);
}
export class ImageSource {
    macos;
    ios = undefined;
    android = undefined;
    get height() {
        if (!this.macos) {
            return NaN;
        }
        const rep = bestRepresentation(this.macos);
        return rep ? rep.pixelsHigh : this.macos.size.height;
    }
    get width() {
        if (!this.macos) {
            return NaN;
        }
        const rep = bestRepresentation(this.macos);
        return rep ? rep.pixelsWide : this.macos.size.width;
    }
    get rotationAngle() {
        return NaN;
    }
    set rotationAngle(_value) {
        // compatibility with Android
    }
    constructor(nativeSource) {
        if (nativeSource) {
            this.setNativeSource(nativeSource);
        }
    }
    static fromAsset(asset) {
        return new Promise((resolve, reject) => {
            if (!asset) {
                reject(new Error('The ImageAsset instance is required.'));
                return;
            }
            asset.getImageAsync((image, error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(new ImageSource(image));
            });
        });
    }
    static fromUrl(url) {
        return httpRequest({ url, method: 'GET' }).then((response) => response.content.toNativeImage().then((value) => new ImageSource(value)));
    }
    static fromResourceSync(name) {
        const nativeSource = NSImage.imageNamed(name) || NSImage.imageNamed(`${name}.jpg`);
        return nativeSource ? new ImageSource(nativeSource) : null;
    }
    static fromResource(name) {
        return new Promise((resolve, reject) => {
            try {
                const source = ImageSource.fromResourceSync(name);
                if (source) {
                    resolve(source);
                }
                else {
                    reject(new Error(`Failed to find image with name: ${name}`));
                }
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
    static fromFileSync(path) {
        const image = NSImage.alloc().initWithContentsOfFile(getFileName(path));
        return image ? new ImageSource(image) : null;
    }
    static fromFile(path) {
        return new Promise((resolve, reject) => {
            try {
                const source = ImageSource.fromFileSync(path);
                if (source) {
                    resolve(source);
                }
                else {
                    reject(new Error('Failed to load image from file: ' + path));
                }
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
    static fromFileOrResourceSync(path) {
        if (!isFileOrResourcePath(path)) {
            if (Trace.isEnabled()) {
                Trace.write('Path "' + path + '" is not a valid file or resource.', Trace.categories.Binding, Trace.messageType.error);
            }
            return null;
        }
        if (path.indexOf(RESOURCE_PREFIX) === 0) {
            return ImageSource.fromResourceSync(path.slice(RESOURCE_PREFIX.length));
        }
        return ImageSource.fromFileSync(path);
    }
    static fromDataSync(data) {
        const image = NSImage.alloc().initWithData(data);
        return image ? new ImageSource(image) : null;
    }
    static fromData(data) {
        return new Promise((resolve, reject) => {
            try {
                const source = ImageSource.fromDataSync(data);
                if (source) {
                    resolve(source);
                }
                else {
                    reject(new Error('Failed to load image from data.'));
                }
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
    static fromBase64Sync(source) {
        let image = null;
        if (typeof source === 'string') {
            const data = NSData.alloc().initWithBase64EncodedStringOptions(source, 1 /* NSDataBase64DecodingIgnoreUnknownCharacters */);
            image = data ? NSImage.alloc().initWithData(data) : null;
        }
        return image ? new ImageSource(image) : null;
    }
    static fromBase64(source) {
        return new Promise((resolve, reject) => {
            try {
                const img = ImageSource.fromBase64Sync(source);
                if (img) {
                    resolve(img);
                }
                else {
                    reject(new Error('Failed to load image from base64.'));
                }
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
    static fromFontIconCodeSync() {
        throw new Error('ImageSource.fromFontIconCode is not implemented on macOS');
    }
    static fromSystemImageSync() {
        return null;
    }
    static fromSystemImage() {
        return Promise.reject(new Error('ImageSource.fromSystemImage is not implemented on macOS'));
    }
    getNativeSource() {
        return this.macos;
    }
    setNativeSource(source) {
        if (!source) {
            this.macos = null;
        }
        else {
            this.macos = source;
        }
    }
    saveToFile(path, format, quality) {
        if (!this.macos) {
            return false;
        }
        const data = getImageData(this.macos, format, quality ? (quality - 0) / 100 : 0.9);
        if (data) {
            return NSFileManager.defaultManager.createFileAtPathContentsAttributes(path, data, null);
        }
        return false;
    }
    toBase64String(format, quality) {
        if (!this.macos) {
            return null;
        }
        const data = getImageData(this.macos, format, quality ? (quality - 0) / 100 : 0.9);
        return data ? data.base64EncodedStringWithOptions(0) : null;
    }
}
export const isImageSourceInstance = (o) => o instanceof ImageSource;
export const releaseNativeImage = () => { };
