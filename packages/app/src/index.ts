export { App } from './App.tsrx';
// Platform services resolve through the suffix chain at build time —
// exports-map wildcards don't extension-resolve, so deep imports like
// '@xplat/app/platform/storage' fail; the barrel is the contract.
export { storage } from '@octane-xplat/platform';
export { navigate, goBack, wireHardwareBack } from './platform/nav';
