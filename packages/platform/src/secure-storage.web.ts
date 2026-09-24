// Secure storage — web has no equivalent trust boundary (IndexedDB is not
// secure enclave storage). Declared unsupported per the Capability contract;
// callers must branch on `supported` rather than catching.
import type { Capability } from './types';

export interface SecureStore {
	get(key: string): Promise<string | null>;
	set(key: string, value: string): Promise<boolean>;
	remove(key: string): Promise<boolean>;
}

export const secureStorage: Capability<SecureStore> = {
	supported: false,
	ensure: async () => 'unsupported',
	impl: null,
};
