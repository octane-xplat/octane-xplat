// Feasibility probe bundle: runs inside the NativeScript Windows preview host.
// Logs SPEECH * markers to console.log (package LocalState) for the driver.
// No package imports — exercises only the projected WinRT globals.

for (const name of ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']) {
  globalThis[name] ??= globalThis['__ns__' + name]
}

const log = (message) => console.log(message)

const toPromise = (op) => {
  const { NSWinRT } = globalThis
  if (NSWinRT?.toPromise && op != null) {
    return NSWinRT.toPromise(op)
  }
  if (op?.done) {
    return new Promise((resolve, reject) => {
      try {
        op.done(resolve, reject)
      } catch (cause) {
        reject(cause)
      }
    })
  }
  return Promise.resolve(op)
}

const withTimeout = (promise, ms, tag) =>
  Promise.race([
    promise,
    new Promise((resolve) =>
      setTimeout(() => resolve({ __timedOut: true, tag }), ms),
    ),
  ])

const describeError = (error) => {
  const out = { name: error?.name, message: String(error?.message ?? error) }
  for (const key of ['number', 'hresult', 'code', 'status', 'HRESULT']) {
    try {
      if (error && error[key] !== undefined) {out[key] = error[key]}
    } catch {
      /* ignore */
    }
  }
  try {
    const extra = Object.getOwnPropertyNames(error ?? {}).filter(
      (k) => !(k in out) && k !== 'stack',
    )
    if (extra.length) {out.props = extra.slice(0, 10)}
    if (error?.stack) {out.stack = String(error.stack).split('\n').slice(0, 4)}
  } catch {
    /* ignore */
  }
  return out
}

// For each name report null | {t:'function'} | {t:'object',k:[props]} | {err}
const dump = (obj, names) => {
  const found = {}
  for (const name of names) {
    try {
      const value = obj?.[name]
      if (value == null) {
        found[name] = null
        continue
      }
      const type = typeof value
      if (type === 'object') {
        try {
          found[name] = { t: type, k: Object.getOwnPropertyNames(value).slice(0, 24) }
        } catch {
          found[name] = { t: type }
        }
      } else {
        found[name] = { t: type }
      }
    } catch (error) {
      found[name] = { err: String(error).slice(0, 90) }
    }
  }
  return found
}

const enumName = (enumObj, value) => {
  try {
    for (const key of Object.getOwnPropertyNames(enumObj)) {
      if (enumObj[key] === value) {return key}
    }
  } catch {
    /* ignore */
  }
  return undefined
}

const listToArray = (list) => {
  try {
    if (list == null) {return null}
    if (Array.isArray(list)) {return list}
    const out = []
    const size = list.size ?? list.Size ?? list.length
    if (typeof size === 'number') {
      for (let i = 0; i < Math.min(size, 32); i++) {out.push(list[i])}
    } else if (typeof list[Symbol.iterator] === 'function') {
      for (const item of list) {
        out.push(item)
        if (out.length >= 32) {break}
      }
    } else {
      return { opaque: true, type: typeof list, props: Object.getOwnPropertyNames(list).slice(0, 12) }
    }
    return out.map((l) => {
      try {
        return l?.LanguageTag ?? l?.DisplayName ?? String(l)
      } catch {
        return '?'
      }
    })
  } catch (error) {
    return { err: String(error).slice(0, 90) }
  }
}

const ui = Microsoft.UI.Xaml
const window = new ui.Window()
window.Title = 'XplatSpeech'
const box = new ui.Controls.StackPanel()
const text = new ui.Controls.TextBlock()
text.Text = 'speech probe'
box.Children.Append(text)
window.Content = box
window.Activate()

setTimeout(() => {
  probe().catch((error) => log('SPEECH FATAL ' + JSON.stringify(describeError(error))))
}, 400)

async function probe() {
  const W = globalThis.Windows
  log(
    'SPEECH GLOBALS ' +
      JSON.stringify({
        Windows: typeof W,
        Microsoft: typeof globalThis.Microsoft,
        NSWinRT: typeof globalThis.NSWinRT,
        toPromise: typeof globalThis.NSWinRT?.toPromise,
      }),
  )
  if (!W) {
    log('SPEECH DONE')
    return
  }

  log(
    'SPEECH MEDIA ' +
      JSON.stringify(
        dump(W.Media, [
          'SpeechRecognition',
          'SpeechSynthesis',
          'Capture',
          'CaptureFrames',
          'Audio',
          'Core',
          'Playback',
          'MediaProperties',
          'Transcoding',
          'Devices',
          'Effects',
          'Editing',
          'Import',
          'Ocr',
          'Protection',
          'FaceAnalysis',
          'AppBroadcasting',
          'AppRecording',
          'Casting',
          'ClosedCaptioning',
          'ContentRestrictions',
          'DialProtocol',
          'PlayTo',
          'Render',
          'MixedRealityCapture',
          'RemoteDisplay',
          'MediaControl',
          'Playlists',
          'SystemMediaTransportControls',
          'MediaTimelineController',
          'AutoRepeatMode',
          'SoundLevel',
        ]),
      ),
  )

  const SR = W.Media?.SpeechRecognition
  log(
    'SPEECH NS ' +
      JSON.stringify(
        dump(SR, [
          'SpeechRecognizer',
          'SpeechRecognizerState',
          'SpeechRecognitionTopicConstraint',
          'SpeechRecognitionListConstraint',
          'SpeechRecognitionGrammarFileConstraint',
          'SpeechRecognitionScenario',
          'SpeechRecognitionCompilationResult',
          'SpeechRecognitionResult',
          'SpeechRecognitionResultStatus',
          'SpeechRecognitionConfidence',
          'SpeechRecognitionAudioProblem',
          'SpeechRecognitionQualityDegradation',
          'SpeechRecognitionContinuousRecognitionSession',
          'SpeechRecognitionConstraintProbabilities',
          'SpeechRecognitionConstraintType',
          'SpeechRecognitionUI',
          'SpeechRecognizerTimeouts',
          'SpeechRecognitionSemanticInterpretation',
        ]),
      ),
  )

  // Sibling speech API — distinguishes a metadata gap from a packaging issue.
  log(
    'SPEECH SYNTH ' +
      JSON.stringify(
        dump(W.Media?.SpeechSynthesis, [
          'SpeechSynthesizer',
          'SpeechSynthesisStream',
          'SpeechSynthesizerOptions',
          'SpeechSynthesizerState',
          'VoiceInformation',
        ]),
      ),
  )
  log('SPEECH GLOBALIZATION ' + JSON.stringify(dump(W.Globalization, ['Language', 'Calendar'])))

  if (SR?.SpeechRecognizer == null) {
    log('SPEECH DONE')
    return
  }

  try {
    const lang = SR.SpeechRecognizer.SystemSpeechLanguage
    log(
      'SPEECH LANG ' +
        JSON.stringify({
          system: lang ? { tag: lang.LanguageTag, name: lang.DisplayName } : null,
          topics: listToArray(SR.SpeechRecognizer.SupportedTopicLanguages),
          grammars: listToArray(SR.SpeechRecognizer.SupportedGrammarLanguages),
        }),
    )
  } catch (error) {
    log('SPEECH LANGFAIL ' + JSON.stringify(describeError(error)))
  }

  let recognizer
  try {
    recognizer = new SR.SpeechRecognizer()
    log('SPEECH CTOR ok')
  } catch (error) {
    log('SPEECH CTORFAIL ' + JSON.stringify(describeError(error)))
    log('SPEECH DONE')
    return
  }

  try {
    const t = recognizer.Timeouts
    log(
      'SPEECH TIMEOUTS ' +
        JSON.stringify(
          t
            ? { initial: String(t.InitialSilenceTimeout), babble: String(t.BabbleTimeout), end: String(t.EndSilenceTimeout) }
            : null,
        ),
    )
  } catch (error) {
    log('SPEECH TIMEOUTSERR ' + JSON.stringify(describeError(error)))
  }

  try {
    log(
      'SPEECH SESSION ' +
        JSON.stringify({
          state: recognizer.State,
          stateName: enumName(SR.SpeechRecognizerState, recognizer.State),
          continuous: recognizer.ContinuousRecognitionSession != null,
          uiClass: SR.SpeechRecognitionUI != null,
          constraintsType: typeof recognizer.Constraints,
          constraintProps: recognizer.Constraints
            ? Object.getOwnPropertyNames(recognizer.Constraints).slice(0, 16)
            : null,
        }),
    )
  } catch (error) {
    log('SPEECH SESSIONERR ' + JSON.stringify(describeError(error)))
  }

  try {
    const scenario = SR.SpeechRecognitionScenario?.Dictation ?? 1
    let constraint
    try {
      constraint = new SR.SpeechRecognitionTopicConstraint(scenario, 'dictation')
    } catch {
      constraint = new SR.SpeechRecognitionTopicConstraint(scenario, 'dictation', 'probe')
    }
    const constraints = recognizer.Constraints
    if (typeof constraints.Append === 'function') {
      constraints.Append(constraint)
    } else if (typeof constraints.push === 'function') {
      constraints.push(constraint)
    } else {
      constraints[0] = constraint
    }
    const compiled = await withTimeout(toPromise(recognizer.CompileConstraintsAsync()), 15_000, 'compile')
    log(
      'SPEECH COMPILED ' +
        JSON.stringify(
          compiled?.__timedOut
            ? { timedOut: true }
            : {
                status: compiled?.Status,
                statusName: enumName(SR.SpeechRecognitionResultStatus, compiled?.Status),
              },
        ),
    )
  } catch (error) {
    log('SPEECH COMPILEFAIL ' + JSON.stringify(describeError(error)))
    log('SPEECH DONE')
    return
  }

  try {
    const NRT = globalThis.NSWinRT
    if (NRT?.asDelegate) {
      recognizer.HypothesisGenerated = NRT.asDelegate(
        'Windows.Foundation.TypedEventHandler`2<Windows.Media.SpeechRecognition.SpeechRecognizer,Windows.Media.SpeechRecognition.SpeechRecognitionHypothesisGeneratedEventArgs>',
        (_s, e) => {
          try {
            log('SPEECH HYPOTHESIS ' + JSON.stringify({ text: e?.Hypothesis?.Text }))
          } catch (err) {
            log('SPEECH HYPOTHESIS err ' + String(err).slice(0, 80))
          }
        },
      )
      recognizer.StateChanged = NRT.asDelegate(
        'Windows.Foundation.TypedEventHandler`2<Windows.Media.SpeechRecognition.SpeechRecognizer,Windows.Media.SpeechRecognition.SpeechRecognizerStateChangedEventArgs>',
        (_s, e) => {
          try {
            log('SPEECH STATECHANGED ' + JSON.stringify({ state: e?.State }))
          } catch (err) {
            log('SPEECH STATECHANGED err ' + String(err).slice(0, 80))
          }
        },
      )
      log('SPEECH EVENTS subscribed')
    } else {
      log('SPEECH EVENTS asDelegate missing')
    }
  } catch (error) {
    log('SPEECH EVENTSERR ' + JSON.stringify(describeError(error)))
  }

  const statusName = (v) => enumName(SR.SpeechRecognitionResultStatus, v)

  for (let attempt = 1; attempt <= 2; attempt++) {
    const ticker = setInterval(() => {
      try {
        log('SPEECH POLLSTATE ' + recognizer.State)
      } catch (err) {
        log('SPEECH POLLSTATE err ' + String(err).slice(0, 60))
      }
    }, 4000)
    try {
      log(`SPEECH LISTENING ${attempt}`)
      const result = await withTimeout(toPromise(recognizer.RecognizeAsync()), 45_000, 'recognize')
      if (result?.__timedOut) {
        log('SPEECH RESULT ' + JSON.stringify({ attempt, timedOut: true }))
        break
      }
      const alternates = []
      try {
        const list = result?.GetAlternates?.(3)
        const arr = listToArray(list)
        if (Array.isArray(arr)) {alternates.push(...arr)}
      } catch {
        /* ignore */
      }
      log(
        'SPEECH RESULT ' +
          JSON.stringify({
            attempt,
            status: result?.Status,
            statusName: statusName(result?.Status),
            text: result?.Text,
            confidence: result?.Confidence,
            confidenceName: enumName(SR.SpeechRecognitionConfidence, result?.Confidence),
            audioProblem: result?.AudioProblem,
            audioProblemName: enumName(SR.SpeechRecognitionAudioProblem, result?.AudioProblem),
            alternates,
            duration: String(result?.PhraseDuration ?? ''),
          }),
      )
      if (result?.Status === 0 && result?.Text) {break}
    } catch (error) {
      log('SPEECH RECOGNIZEFAIL ' + JSON.stringify({ attempt, ...describeError(error) }))
      break
    } finally {
      clearInterval(ticker)
    }
  }

  log('SPEECH DONE')
}
