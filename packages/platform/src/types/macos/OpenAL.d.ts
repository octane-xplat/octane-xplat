import type { interop } from './objc-runtime'



export declare class ALCdevice_struct {
  constructor(init?: ALCdevice_struct);
}

export declare class ALCcontext_struct {
  constructor(init?: ALCcontext_struct);
}

export declare function alEnable(capability: number): void;

export declare function alDisable(capability: number): void;

export declare function alIsEnabled(capability: number): number;

export declare function alGetString(param: number): string;

export declare function alGetBooleanv(param: number, data: string): void;

export declare function alGetIntegerv(param: number, data: interop.PointerConvertible): void;

export declare function alGetFloatv(param: number, data: interop.PointerConvertible): void;

export declare function alGetDoublev(param: number, data: interop.PointerConvertible): void;

export declare function alGetBoolean(param: number): number;

export declare function alGetInteger(param: number): number;

export declare function alGetFloat(param: number): number;

export declare function alGetDouble(param: number): number;

export declare function alGetError(): number;

export declare function alIsExtensionPresent(extname: string): number;

export declare function alGetProcAddress(fname: string): interop.Pointer;

export declare function alGetEnumValue(ename: string): number;

export declare function alListenerf(param: number, value: number): void;

export declare function alListener3f(param: number, value1: number, value2: number, value3: number): void;

export declare function alListenerfv(param: number, values: interop.PointerConvertible): void;

export declare function alListeneri(param: number, value: number): void;

export declare function alListener3i(param: number, value1: number, value2: number, value3: number): void;

export declare function alListeneriv(param: number, values: interop.PointerConvertible): void;

export declare function alGetListenerf(param: number, value: interop.PointerConvertible): void;

export declare function alGetListener3f(param: number, value1: interop.PointerConvertible, value2: interop.PointerConvertible, value3: interop.PointerConvertible): void;

export declare function alGetListenerfv(param: number, values: interop.PointerConvertible): void;

export declare function alGetListeneri(param: number, value: interop.PointerConvertible): void;

export declare function alGetListener3i(param: number, value1: interop.PointerConvertible, value2: interop.PointerConvertible, value3: interop.PointerConvertible): void;

export declare function alGetListeneriv(param: number, values: interop.PointerConvertible): void;

export declare function alGenSources(n: number, sources: interop.PointerConvertible): void;

export declare function alDeleteSources(n: number, sources: interop.PointerConvertible): void;

export declare function alIsSource(sid: number): number;

export declare function alSourcef(sid: number, param: number, value: number): void;

export declare function alSource3f(sid: number, param: number, value1: number, value2: number, value3: number): void;

export declare function alSourcefv(sid: number, param: number, values: interop.PointerConvertible): void;

export declare function alSourcei(sid: number, param: number, value: number): void;

export declare function alSource3i(sid: number, param: number, value1: number, value2: number, value3: number): void;

export declare function alSourceiv(sid: number, param: number, values: interop.PointerConvertible): void;

export declare function alGetSourcef(sid: number, param: number, value: interop.PointerConvertible): void;

export declare function alGetSource3f(sid: number, param: number, value1: interop.PointerConvertible, value2: interop.PointerConvertible, value3: interop.PointerConvertible): void;

export declare function alGetSourcefv(sid: number, param: number, values: interop.PointerConvertible): void;

export declare function alGetSourcei(sid: number, param: number, value: interop.PointerConvertible): void;

export declare function alGetSource3i(sid: number, param: number, value1: interop.PointerConvertible, value2: interop.PointerConvertible, value3: interop.PointerConvertible): void;

export declare function alGetSourceiv(sid: number, param: number, values: interop.PointerConvertible): void;

export declare function alSourcePlayv(ns: number, sids: interop.PointerConvertible): void;

export declare function alSourceStopv(ns: number, sids: interop.PointerConvertible): void;

export declare function alSourceRewindv(ns: number, sids: interop.PointerConvertible): void;

export declare function alSourcePausev(ns: number, sids: interop.PointerConvertible): void;

export declare function alSourcePlay(sid: number): void;

export declare function alSourceStop(sid: number): void;

export declare function alSourceRewind(sid: number): void;

export declare function alSourcePause(sid: number): void;

export declare function alSourceQueueBuffers(sid: number, numEntries: number, bids: interop.PointerConvertible): void;

export declare function alSourceUnqueueBuffers(sid: number, numEntries: number, bids: interop.PointerConvertible): void;

export declare function alGenBuffers(n: number, buffers: interop.PointerConvertible): void;

export declare function alDeleteBuffers(n: number, buffers: interop.PointerConvertible): void;

export declare function alIsBuffer(bid: number): number;

export declare function alBufferData(bid: number, format: number, data: interop.PointerConvertible, size: number, freq: number): void;

export declare function alBufferf(bid: number, param: number, value: number): void;

export declare function alBuffer3f(bid: number, param: number, value1: number, value2: number, value3: number): void;

export declare function alBufferfv(bid: number, param: number, values: interop.PointerConvertible): void;

export declare function alBufferi(bid: number, param: number, value: number): void;

export declare function alBuffer3i(bid: number, param: number, value1: number, value2: number, value3: number): void;

export declare function alBufferiv(bid: number, param: number, values: interop.PointerConvertible): void;

export declare function alGetBufferf(bid: number, param: number, value: interop.PointerConvertible): void;

export declare function alGetBuffer3f(bid: number, param: number, value1: interop.PointerConvertible, value2: interop.PointerConvertible, value3: interop.PointerConvertible): void;

export declare function alGetBufferfv(bid: number, param: number, values: interop.PointerConvertible): void;

export declare function alGetBufferi(bid: number, param: number, value: interop.PointerConvertible): void;

export declare function alGetBuffer3i(bid: number, param: number, value1: interop.PointerConvertible, value2: interop.PointerConvertible, value3: interop.PointerConvertible): void;

export declare function alGetBufferiv(bid: number, param: number, values: interop.PointerConvertible): void;

export declare function alDopplerFactor(value: number): void;

export declare function alDopplerVelocity(value: number): void;

export declare function alSpeedOfSound(value: number): void;

export declare function alDistanceModel(distanceModel: number): void;

export declare function alcCreateContext(device: interop.PointerConvertible, attrlist: interop.PointerConvertible): interop.Pointer;

export declare function alcMakeContextCurrent(context: interop.PointerConvertible): number;

export declare function alcProcessContext(context: interop.PointerConvertible): void;

export declare function alcSuspendContext(context: interop.PointerConvertible): void;

export declare function alcDestroyContext(context: interop.PointerConvertible): void;

export declare function alcGetCurrentContext(): interop.Pointer;

export declare function alcGetContextsDevice(context: interop.PointerConvertible): interop.Pointer;

export declare function alcOpenDevice(devicename: string): interop.Pointer;

export declare function alcCloseDevice(device: interop.PointerConvertible): number;

export declare function alcGetError(device: interop.PointerConvertible): number;

export declare function alcIsExtensionPresent(device: interop.PointerConvertible, extname: string): number;

export declare function alcGetProcAddress(device: interop.PointerConvertible, funcname: string): interop.Pointer;

export declare function alcGetEnumValue(device: interop.PointerConvertible, enumname: string): number;

export declare function alcGetString(device: interop.PointerConvertible, param: number): string;

export declare function alcGetIntegerv(device: interop.PointerConvertible, param: number, size: number, data: interop.PointerConvertible): void;

export declare function alcCaptureOpenDevice(devicename: string, frequency: number, format: number, buffersize: number): interop.Pointer;

export declare function alcCaptureCloseDevice(device: interop.PointerConvertible): number;

export declare function alcCaptureStart(device: interop.PointerConvertible): void;

export declare function alcCaptureStop(device: interop.PointerConvertible): void;

export declare function alcCaptureSamples(device: interop.PointerConvertible, buffer: interop.PointerConvertible, samples: number): void;

export declare function alutInit(argc: interop.PointerConvertible, argv: interop.PointerConvertible): void;

export declare function alutExit(): void;

export declare function alutLoadWAVFile(file: string, format: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible, freq: interop.PointerConvertible): void;

export declare function alutLoadWAVMemory(memory: string, format: interop.PointerConvertible, data: interop.PointerConvertible, size: interop.PointerConvertible, freq: interop.PointerConvertible): void;

export declare function alutUnloadWAV(format: number, data: interop.PointerConvertible, size: number, freq: number): void;
