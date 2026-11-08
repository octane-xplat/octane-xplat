// See XplatSpeechRecognizer.h — this file ships byte-identically for iOS
// and macOS; platform differences are confined to TARGET_OS_IPHONE blocks.
#import "XplatSpeechRecognizer.h"

#import <AVFoundation/AVFoundation.h>
#import <Speech/Speech.h>

#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#endif

NSString *const XplatSpeechErrorDomain = @"XplatSpeechRecognizer";

@interface XplatSpeechRecognizer ()
@property(nonatomic, strong) AVAudioEngine *engine;
@property(nonatomic, strong) SFSpeechRecognizer *recognizer;
@property(nonatomic, strong) SFSpeechAudioBufferRecognitionRequest *request;
@property(nonatomic, strong) SFSpeechRecognitionTask *task;
@property(nonatomic, copy) XplatSpeechEventHandler onEvent;
@property(nonatomic, assign) BOOL closed;
@property(nonatomic, strong) NSArray *observers;
@end

@implementation XplatSpeechRecognizer

+ (NSString *)defaultLanguage {
  // localeIdentifier is en_US-style; BCP-47 wants hyphens.
  return [[NSLocale currentLocale].localeIdentifier
      stringByReplacingOccurrencesOfString:@"_"
                                withString:@"-"];
}

+ (BOOL)isConfigured {
  NSDictionary *info = NSBundle.mainBundle.infoDictionary;
  id speech = info[@"NSSpeechRecognitionUsageDescription"];
  id mic = info[@"NSMicrophoneUsageDescription"];
  return [speech isKindOfClass:NSString.class] && [(NSString *)speech length] > 0 &&
         [mic isKindOfClass:NSString.class] && [(NSString *)mic length] > 0;
}

+ (NSString *)permissionStatus {
  AVAuthorizationStatus mic = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio];
  SFSpeechRecognizerAuthorizationStatus speech = [SFSpeechRecognizer authorizationStatus];
  BOOL micDenied = mic == AVAuthorizationStatusDenied || mic == AVAuthorizationStatusRestricted;
  BOOL speechDenied = speech == SFSpeechRecognizerAuthorizationStatusDenied ||
                      speech == SFSpeechRecognizerAuthorizationStatusRestricted;
  if (micDenied || speechDenied) {
    return @"denied";
  }
  if (mic == AVAuthorizationStatusAuthorized &&
      speech == SFSpeechRecognizerAuthorizationStatusAuthorized) {
    return @"granted";
  }
  return @"undetermined";
}

+ (void)requestPermission:(void (^)(NSString *status))completion {
  [AVCaptureDevice
      requestAccessForMediaType:AVMediaTypeAudio
              completionHandler:^(BOOL micGranted) {
                [SFSpeechRecognizer
                    requestAuthorization:^(SFSpeechRecognizerAuthorizationStatus speech) {
                      NSString *status;
                      if (micGranted &&
                          speech == SFSpeechRecognizerAuthorizationStatusAuthorized) {
                        status = @"granted";
                      } else if (speech == SFSpeechRecognizerAuthorizationStatusNotDetermined) {
                        status = @"undetermined";
                      } else {
                        status = @"denied";
                      }
                      dispatch_async(dispatch_get_main_queue(), ^{
                        completion(status);
                      });
                    }];
              }];
}

+ (NSString *)availabilityJSON:(NSString *)lang {
  SFSpeechRecognizer *recognizer =
      [[SFSpeechRecognizer alloc] initWithLocale:[NSLocale localeWithLocaleIdentifier:lang]];
  BOOL available = recognizer != nil && recognizer.available;
  // Keep the result in a BOOL lvalue — boxing the && expression directly
  // yields numberWithInt (JSON 1), which the JS ingress rejects.
  BOOL onDevice = recognizer != nil && recognizer.supportsOnDeviceRecognition;
  NSDictionary *payload = @{
    @"available" : @(available),
    @"reason" : available
        ? (id)[NSNull null]
        : (recognizer == nil ? @"language-unsupported" : @"service-unavailable"),
    @"lang" : lang ?: @"",
    @"onDevice" : @(onDevice),
  };
  NSData *data = [NSJSONSerialization dataWithJSONObject:payload options:0 error:nil];
  return data ? [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] : @"{}";
}

+ (instancetype)startWithLanguage:(NSString *)lang
                   interimResults:(BOOL)interim
                       continuous:(BOOL)continuous
                           onEvent:(XplatSpeechEventHandler)onEvent {
  XplatSpeechRecognizer *instance = [[XplatSpeechRecognizer alloc] init];
  instance.onEvent = onEvent;
  [instance beginWithLanguage:lang interim:interim continuous:continuous];
  return instance;
}

- (void)emit:(NSString *)type
        text:(NSString *)text
       final:(BOOL)final
      domain:(NSString *)domain
        code:(NSInteger)code
     message:(NSString *)message {
  if (self.closed) {
    return;
  }
  BOOL terminal = [type isEqualToString:@"error"] || [type isEqualToString:@"finished"] ||
                  [type isEqualToString:@"interrupted"];
  XplatSpeechEventHandler handler = self.onEvent;
  dispatch_async(dispatch_get_main_queue(), ^{
    // Terminal events queued before cancel still deliver; non-terminal
    // events that raced a cancel are dropped here.
    if (self.closed && !terminal) {
      return;
    }
    handler(type, text ?: @"", final, domain ?: @"", code, message ?: @"");
  });
}

- (void)emitFacadeError:(XplatSpeechErrorCode)code message:(NSString *)message {
  [self emit:@"error"
        text:@""
       final:NO
      domain:XplatSpeechErrorDomain
        code:code
     message:message];
  [self teardown];
}

- (void)emitNSError:(NSError *)error {
  [self emit:@"error"
        text:@""
       final:NO
      domain:error.domain
        code:error.code
     message:error.localizedDescription ?: @"recognition failed"];
  [self teardown];
}

- (void)beginWithLanguage:(NSString *)lang
                  interim:(BOOL)interim
               continuous:(BOOL)continuous {
  self.recognizer =
      [[SFSpeechRecognizer alloc] initWithLocale:[NSLocale localeWithLocaleIdentifier:lang]];
  if (self.recognizer == nil) {
    [self emitFacadeError:XplatSpeechErrorLanguageUnsupported
                  message:[NSString
                              stringWithFormat:@"No speech recognizer for language %@", lang]];
    return;
  }
  if (!self.recognizer.available) {
    [self emitFacadeError:XplatSpeechErrorRecognizerUnavailable
                  message:@"The speech recognizer is unavailable"];
    return;
  }

#if TARGET_OS_IPHONE
  AVAudioSession *session = AVAudioSession.sharedInstance;
  NSError *sessionError = nil;
  if (![session setCategory:AVAudioSessionCategoryRecord
                       mode:AVAudioSessionModeMeasurement
                    options:AVAudioSessionCategoryOptionDuckOthers
                      error:&sessionError] ||
      ![session setActive:YES error:&sessionError]) {
    [self emitNSError:sessionError ?: [NSError errorWithDomain:XplatSpeechErrorDomain
                                                          code:XplatSpeechErrorAudioSession
                                                      userInfo:@{
                                                        NSLocalizedDescriptionKey :
                                                            @"Audio session configuration failed"
                                                      }]];
    return;
  }
#endif

  self.request = [[SFSpeechAudioBufferRecognitionRequest alloc] init];
  self.request.shouldReportPartialResults = interim;
  self.request.requiresOnDeviceRecognition = NO;
  if (@available(iOS 16, macOS 13, *)) {
    self.request.addsPunctuation = YES;
  }

  self.engine = [[AVAudioEngine alloc] init];
  AVAudioInputNode *input = self.engine.inputNode;
  AVAudioFormat *format = [input outputFormatForBus:0];
  if (format.sampleRate <= 0 || format.channelCount == 0) {
    [self emitFacadeError:XplatSpeechErrorNoAudioInput
                  message:@"No audio input device is available"];
    return;
  }

  SFSpeechAudioBufferRecognitionRequest *request = self.request;
  AVAudioNodeTapBlock tapBlock = ^(AVAudioPCMBuffer *buffer, AVAudioTime *when) {
    // The tap block runs on the realtime audio thread — it only appends
    // buffers to the request; no JS or ObjC event work happens here.
    [request appendAudioPCMBuffer:buffer];
  };
  BOOL tapInstalled = NO;
  NSError *tapError = nil;
  if (@available(iOS 27, macOS 27, *)) {
    tapInstalled = [input installTapOnBus:0
                             bufferSize:1024
                                 format:format
                                  error:&tapError
                                  block:tapBlock];
  } else {
// The deprecated selector is the only path below OS 27.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [input installTapOnBus:0 bufferSize:1024 format:format block:tapBlock];
#pragma clang diagnostic pop
    tapInstalled = YES;
  }
  if (!tapInstalled) {
    [self emitNSError:tapError ?: [NSError errorWithDomain:XplatSpeechErrorDomain
                                                      code:XplatSpeechErrorNoAudioInput
                                                  userInfo:@{
                                                    NSLocalizedDescriptionKey :
                                                        @"The audio input tap failed to install"
                                                  }]];
    return;
  }

  NSError *engineError = nil;
  [self.engine prepare];
  if (![self.engine startAndReturnError:&engineError]) {
    [input removeTapOnBus:0];
    [self emitNSError:engineError ?: [NSError errorWithDomain:XplatSpeechErrorDomain
                                                         code:XplatSpeechErrorAudioEngineStart
                                                     userInfo:@{
                                                       NSLocalizedDescriptionKey :
                                                           @"The audio engine failed to start"
                                                     }]];
    return;
  }

  [self observeInterruptions];

  __weak XplatSpeechRecognizer *weakSelf = self;
  self.task = [self.recognizer
      recognitionTaskWithRequest:request
                   resultHandler:^(SFSpeechRecognitionResult *result, NSError *error) {
                     [weakSelf handleResult:result error:error];
                   }];

  [self emit:@"listening" text:@"" final:NO domain:@"" code:0 message:@""];
}

- (void)handleResult:(SFSpeechRecognitionResult *)result error:(NSError *)error {
  if (self.closed) {
    return;
  }
  if (result != nil) {
    BOOL segmentFinal = result.isFinal;
    if (!segmentFinal &&
        [result respondsToSelector:@selector(speechRecognitionMetadata)]) {
      // iOS 14.5+ / macOS 11.3+: metadata marks the end of an utterance —
      // the next result's formattedString restarts for the new segment.
      segmentFinal = result.speechRecognitionMetadata != nil;
    }
    [self emit:@"hypothesis"
          text:result.bestTranscription.formattedString ?: @""
         final:segmentFinal
        domain:@""
          code:0
       message:@""];
    if (result.isFinal) {
      [self emit:@"finished" text:@"" final:NO domain:@"" code:0 message:@""];
      [self teardown];
    }
    return;
  }
  if (error != nil) {
    [self emitNSError:error];
  }
}

- (void)observeInterruptions {
  // Handlers mutate facade state — deliver them on the main queue rather
  // than whatever thread posts the notification.
  NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
  NSOperationQueue *queue = NSOperationQueue.mainQueue;
  NSMutableArray *observers = [NSMutableArray array];
  void (^interrupted)(NSString *) = ^(NSString *message) {
    [self emit:@"interrupted"
          text:@""
         final:NO
        domain:XplatSpeechErrorDomain
          code:0
       message:message];
    [self cancel];
  };
#if TARGET_OS_IPHONE
  [observers addObject:[center addObserverForName:AVAudioSessionInterruptionNotification
                                         object:nil
                                          queue:queue
                                     usingBlock:^(NSNotification *note) {
                                       NSNumber *type =
                                           note.userInfo[AVAudioSessionInterruptionTypeKey];
                                       if (type.unsignedIntegerValue ==
                                           AVAudioSessionInterruptionTypeBegan) {
                                         interrupted(@"The audio session was interrupted");
                                       }
                                     }]];
  [observers addObject:[center
      addObserverForName:AVAudioSessionMediaServicesWereResetNotification
                  object:nil
                   queue:queue
              usingBlock:^(NSNotification *note) {
                interrupted(@"Media services were reset");
              }]];
  [observers addObject:[center
      addObserverForName:UIApplicationDidEnterBackgroundNotification
                  object:nil
                   queue:queue
              usingBlock:^(NSNotification *note) {
                interrupted(@"The app entered the background");
              }]];
#else
  [observers addObject:[center
      addObserverForName:AVAudioEngineConfigurationChangeNotification
                  object:self.engine
                   queue:queue
              usingBlock:^(NSNotification *note) {
                interrupted(@"The audio device configuration changed");
              }]];
#endif
  self.observers = observers;
}

// Stops capture hardware and observers without closing the event stream —
// events already emitted still deliver on the main queue.
- (void)teardown {
  for (id observer in self.observers) {
    [NSNotificationCenter.defaultCenter removeObserver:observer];
  }
  self.observers = @[];
  if (self.engine.isRunning) {
    [self.engine stop];
  }
  [self.engine.inputNode removeTapOnBus:0];
#if TARGET_OS_IPHONE
  [AVAudioSession.sharedInstance
      setActive:NO
    withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
          error:nil];
#endif
}

- (void)finish {
  if (self.closed) {
    return;
  }
  [self.request endAudio];
  if (self.engine.isRunning) {
    [self.engine stop];
  }
  [self.engine.inputNode removeTapOnBus:0];
}

- (void)cancel {
  if (self.closed) {
    return;
  }
  self.closed = YES;
  for (id observer in self.observers) {
    [NSNotificationCenter.defaultCenter removeObserver:observer];
  }
  self.observers = @[];
  [self.task cancel];
  [self.request endAudio];
  if (self.engine.isRunning) {
    [self.engine stop];
  }
  [self.engine.inputNode removeTapOnBus:0];
#if TARGET_OS_IPHONE
  [AVAudioSession.sharedInstance
      setActive:NO
    withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
          error:nil];
#endif
  self.task = nil;
  self.request = nil;
  self.engine = nil;
  self.recognizer = nil;
}

@end
