import type { OpenWindowOptions } from './props.js';
export interface LinuxWindowHandle {
    readonly id: string;
    readonly closed: Promise<void>;
    close(): void;
    setTitle(title: string): void;
}
export declare function openWindow(options?: OpenWindowOptions & {
    kind?: 'regular' | 'dialog';
    title?: string;
    size?: {
        width: number;
        height: number;
    };
}): LinuxWindowHandle | Window | null;
