setTimeout(() => {
  __hostLog('timer fired')
  __xplatStopHost()
}, 10)

// eslint-disable-next-line no-unused-expressions -- The script completion value is the JavaScriptCore smoke result.
;('scheduled')
