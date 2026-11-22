// Borrowed from NativeScript/NativeScript PR #11089:
// packages/core/http/index.macos.ts (types stripped)
import { request } from '@nativescript/core/http/http-request';
export { request } from '@nativescript/core/http/http-request';
export * from '@nativescript/core/http/http-interfaces';
export function getString(arg) {
    return new Promise((resolve, reject) => {
        request(typeof arg === 'string' ? { url: arg, method: 'GET' } : arg).then((r) => { try {
            resolve(r.content.toString());
        }
        catch (e) {
            reject(e);
        } }, (e) => reject(e));
    });
}
export function getJSON(arg) {
    return new Promise((resolve, reject) => {
        request(typeof arg === 'string' ? { url: arg, method: 'GET' } : arg).then((r) => { try {
            resolve(r.content.toJSON());
        }
        catch (e) {
            reject(e);
        } }, (e) => reject(e));
    });
}
export function getImage(arg) {
    return new Promise((resolve, reject) => {
        request(typeof arg === 'string' ? { url: arg, method: 'GET' } : arg).then((r) => { try {
            resolve(r.content.toImage());
        }
        catch (err) {
            reject(err);
        } }, (err) => { reject(err); });
    });
}
export function getFile(arg, destinationFilePath) {
    return new Promise((resolve, reject) => {
        request(typeof arg === 'string' ? { url: arg, method: 'GET' } : arg).then((r) => { try {
            resolve(r.content.toFile(destinationFilePath));
        }
        catch (e) {
            reject(e);
        } }, (e) => reject(e));
    });
}
