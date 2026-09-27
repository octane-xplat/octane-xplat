export type SoundSource = string | {
    uri: string;
};

export type SoundCapabilities = {
    supported: boolean;
    userGestureRequired: boolean;
    maxVoices: number;
    reason?: string;
};

export type SoundBankOptions = {
    maxVoices?: number;
};

export type PlaySoundOptions = {
    volume?: number;
};

export interface SoundBank {
    capabilities(): SoundCapabilities;
    load(name: string, source: SoundSource): Promise<void>;
    play(name: string, options?: PlaySoundOptions): Promise<boolean>;
    stop(name?: string): void;
    dispose(): void;
}

export declare function createSoundBank(options?: SoundBankOptions): SoundBank;
