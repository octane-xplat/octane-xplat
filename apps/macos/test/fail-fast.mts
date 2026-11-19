// @bamboocss/node installs log-only unhandledRejection and uncaughtException
// handlers; without these, fixture build and assertion failures exit 0.
function fatal(error) {
  console.error(error)
  process.exit(1)
}

process.on('uncaughtException', fatal)
process.on('unhandledRejection', fatal)
