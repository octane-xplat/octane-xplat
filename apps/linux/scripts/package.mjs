#!/usr/bin/env node
// Compatibility entry: the CLI owns Linux packaging.
import { packageLinux } from '@octane-xplat/cli/linux'
import { fileURLToPath } from 'node:url'
await packageLinux(fileURLToPath(new URL('../', import.meta.url)))
