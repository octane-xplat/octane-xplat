### Protect recordings from pending camera configuration

Camera configuration now rejects if recording starts or the session is disposed
while camera discovery is pending. A rejected camera change leaves the existing
take running. Camera changes during a recording remain unsupported; choose the
camera before starting automatic recording.

See [camera selection and orientation](https://octane-xplat.goddardai.org/movie-capture#camera-selection-and-orientation).
