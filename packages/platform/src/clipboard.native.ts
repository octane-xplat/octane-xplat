// Core provides native clipboard writes. The plugin remains for reading text,
// which Core does not expose.
import { Utils } from '@nativescript/core';
import { getTextSync } from 'nativescript-clipboard';

async function writeText(text: string): Promise<boolean> {
	try {
		Utils.copyToClipboard(text);
		return true;
	} catch {
		return false;
	}
}

async function readText(): Promise<string | null> {
	try {
		return getTextSync();
	} catch {
		return null;
	}
}

export const clipboard = {
	canCopy: true,
	writeText,
	readText,
	// Keep the original names available for existing consumers.
	write: writeText,
	read: readText,
};
