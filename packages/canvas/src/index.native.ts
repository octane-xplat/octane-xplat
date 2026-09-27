// Platform barrels — explicit .tsrx leaf imports (moduleSuffixes don't
// reach .tsrx; same convention as @octane-xplat/ui index.*.ts).
export { Canvas } from './Canvas.native.tsrx';
export { getGPU } from './gpu.native';
export type { CanvasProps, CanvasContextKind, CanvasReady } from './props';
