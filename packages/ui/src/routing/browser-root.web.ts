// Browser root construction stays behind a file boundary so an SSR build can
// import the UI barrel without requesting a DOM-only export from octane/server.
export { createRoot } from 'octane'
