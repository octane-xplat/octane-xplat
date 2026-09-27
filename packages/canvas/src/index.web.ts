// Platform barrels — explicit .tsrx leaf imports (moduleSuffixes don't
// reach .tsrx; same convention as @octane-xplat/ui index.*.ts).
export { Canvas } from './Canvas.web.tsrx';
export { getGPU } from './gpu.web';
export type { CanvasProps, CanvasContextKind, CanvasReady } from './props';
