import GLib from 'gi://GLib'
import Gio from 'gi://Gio'

export class FileSystemAccess {
  getCurrentAppPath() {
    const [file] = GLib.filename_from_uri(import.meta.url)
    return GLib.path_get_dirname(file)
  }
  getPathSeparator() {
    return '/'
  }
  getTempFolderPath() {
    return GLib.get_tmp_dir()
  }
  getDocumentsFolderPath() {
    return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOCUMENTS) ?? GLib.get_home_dir()
  }
  joinPath(left, right) {
    return GLib.build_filenamev([left, right])
  }
  joinPathsArray(parts) {
    return GLib.build_filenamev(parts)
  }
  normalizePath(path) {
    return GLib.canonicalize_filename(path, null)
  }
  fileExists(path) {
    return GLib.file_test(path, GLib.FileTest.IS_REGULAR)
  }
  folderExists(path) {
    return GLib.file_test(path, GLib.FileTest.IS_DIR)
  }
  readTextSync(path, onError) {
    try {
      const [bytes] = Gio.File.new_for_path(path).load_bytes(null)
      return new TextDecoder().decode(bytes.get_data())
    } catch (error) {
      onError?.(error)
    }
  }
}
export { FileSystemAccess as FileSystemAccess29 }
