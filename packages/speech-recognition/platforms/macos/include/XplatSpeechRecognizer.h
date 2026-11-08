// XplatSpeechRecognizer — Apple speech-recognition facade shared
// byte-identically between the iOS (NativeScript plugin) and macOS (xplat
// host) platform bundles. SFSpeechAudioBufferRecognitionRequest consumes
// AVAudioEngine tap buffers on the realtime audio thread and authorization
// callbacks arrive on background queues, so all capture and recognition
// lives here in ObjC; every event crosses into JS on the main queue only.
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** Facade-defined error domain for failures no NSError can express. */
extern NSString *const XplatSpeechErrorDomain;

typedef NS_ENUM(NSInteger, XplatSpeechErrorCode) {
  /** No SFSpeechRecognizer exists for the requested locale. */
  XplatSpeechErrorLanguageUnsupported = 1,
  /** The recognizer exists but reports available == NO. */
  XplatSpeechErrorRecognizerUnavailable = 2,
  /** The input node exposes no usable capture format. */
  XplatSpeechErrorNoAudioInput = 3,
  /** AVAudioEngine failed to start. */
  XplatSpeechErrorAudioEngineStart = 4,
  /** AVAudioSession category/activation failed (iOS). */
  XplatSpeechErrorAudioSession = 5,
};

/**
 * One event: `listening` (engine started), `hypothesis` (text carries
 * bestTranscription.formattedString, segmentFinal marks a committed
 * segment), `finished` (task completed after its final result), `error`
 * (errorDomain/errorCode/message describe the failure), `interrupted`
 * (message describes the OS interruption; the facade then cancels itself).
 */
typedef void (^XplatSpeechEventHandler)(NSString *type,
                                        NSString *text,
                                        BOOL segmentFinal,
                                        NSString *errorDomain,
                                        NSInteger errorCode,
                                        NSString *message);

@interface XplatSpeechRecognizer : NSObject

/** BCP-47 tag derived from NSLocale (e.g. en-US). */
+ (NSString *)defaultLanguage;

/** The main bundle declares both usage descriptions — unconfigured CLI
 *  hosts report NO so the JS leaf stays unsupported instead of crashing. */
+ (BOOL)isConfigured;

/** Combined microphone + speech authorization, never prompts:
 *  granted | denied (either side denied/restricted) | undetermined. */
+ (NSString *)permissionStatus;

/** Requests microphone access first, then speech authorization. The
 *  completion is always invoked on the main queue with the combined
 *  status vocabulary of +permissionStatus. */
+ (void)requestPermission:(void (^)(NSString *status))completion;

/** {"available":bool,"reason":null|"language-unsupported"|
 *  "service-unavailable","lang":"…","onDevice":bool} for a BCP-47 tag. */
+ (NSString *)availabilityJSON:(NSString *)lang;

/** Creates and starts a session. Start failures are delivered as a single
 *  `error` event (main queue) rather than a thrown/nil result so the JS
 *  glue has one uniform failure path. */
+ (instancetype)startWithLanguage:(NSString *)lang
                   interimResults:(BOOL)interim
                       continuous:(BOOL)continuous
                           onEvent:(XplatSpeechEventHandler)onEvent;

/** Stops audio input and ends the request — the recognizer then delivers
 *  its final result and `finished`. */
- (void)finish;

/** Idempotent: cancels the task, stops the engine, removes the tap,
 *  deactivates the audio session (iOS, notifying others), removes all
 *  observers. No events are emitted after cancel. */
- (void)cancel;

@end

NS_ASSUME_NONNULL_END
