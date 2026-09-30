import type { GoogleAuth, SignInResult } from './types.js';
/** Internal — the button leaf renders the official GIS button into `host`. */
export declare function renderGoogleButton(host: HTMLElement, options: {
    theme?: 'dark' | 'light' | 'auto';
    variant?: 'standard' | 'wide' | 'icon';
    width?: number;
}, onResult: (result: SignInResult) => void): Promise<void>;
export declare const googleAuth: GoogleAuth;
