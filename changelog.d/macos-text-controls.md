# macOS text control interaction parity

Fix macOS TextInput and TextArea imperative refs and focus/blur callbacks.
TextArea now keeps a scrolling document behind fixed rows or an auto-growth cap,
updates growth on text and prop changes, and submits for done/send Return actions.
TextInput switches plain/secure display after mount while retaining its native handle.
