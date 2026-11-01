## Strict UTF-8 text reads with the Node-facing POSIX error vocabulary.
import std/[os, posix]
import ./js_text

proc fileFailure(code: cint, operation, path: string) {.noreturn.} =
  var error: tuple[name,description: string]
  # These C-imported constants are not Nim compile-time case labels on macOS.
  for (number,name,description) in [
    (EACCES,"EACCES","permission denied"),(EPERM,"EPERM","operation not permitted"),
    (ENOENT,"ENOENT","no such file or directory"),(ENOTDIR,"ENOTDIR","not a directory"),
    (EISDIR,"EISDIR","illegal operation on a directory"),(ELOOP,"ELOOP","too many symbolic links encountered"),
    (ENAMETOOLONG,"ENAMETOOLONG","name too long"),(EMFILE,"EMFILE","too many open files"),
    (ENFILE,"ENFILE","file table overflow"),(EBADF,"EBADF","bad file descriptor"),
    (EINVAL,"EINVAL","invalid argument"),(EIO,"EIO","i/o error")]:
    if code == number:
      error = (name,description)
      break
  if error[0] == "": raiseOSError(OSErrorCode(code),path)
  let suffix = if operation == "open": ", open '" & path & "'" else: ", " & operation
  raise newException(IOError,error[0] & ": " & error[1] & suffix)

proc readTextFile*(path: string): string =
  # A JS path string crosses the same UTF-8 boundary as its file contents.
  let encoded = utf8ForWrite(path)
  let descriptor = posix.open(cstring(encoded),O_RDONLY or O_CLOEXEC)
  if descriptor < 0: fileFailure(errno,"open",path)
  defer: discard posix.close(descriptor)
  var bytes: string
  var buffer: array[16384,char]
  while true:
    let count = posix.read(descriptor,addr buffer[0],buffer.len)
    if count == 0: break
    if count < 0:
      let error = errno
      if error == EINTR: continue
      fileFailure(error,"read",path)
    let previous = bytes.len
    bytes.setLen(previous+count)
    copyMem(addr bytes[previous],addr buffer[0],count)
  decodeUtf8(bytes)
