"""Generate NativeScript metadata for the installed WebKitGTK 6 libraries."""
import argparse
import hashlib
import json
from pathlib import Path
import shlex
import subprocess
import tempfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--generator', type=Path, required=True, help='Linux metadata-generator executable')
parser.add_argument('--webkit-include', type=Path, required=True, help='Directory containing webkit/ and jsc/ headers')
parser.add_argument('--soup-include', type=Path, required=True, help='Directory containing libsoup/ headers')
parser.add_argument('--output', type=Path, required=True, help='New output metadata .bin file')
parser.add_argument('--manifest', type=Path, required=True, help='New JSON input and output manifest')
args = parser.parse_args()
generator = args.generator.resolve(strict=True)
webkit = args.webkit_include.resolve(strict=True)
soup = args.soup_include.resolve(strict=True)
output = args.output.resolve()
manifest = args.manifest.resolve()
if output == manifest:
    parser.error('metadata and manifest must use different paths')
for path in (output, manifest):
    if path.exists():
        parser.error(f'output already exists: {path}')
    if not path.parent.is_dir():
        parser.error(f'output directory does not exist: {path.parent}')
for path in (webkit / 'webkit/webkit.h', webkit / 'jsc/jsc.h', soup / 'libsoup/soup.h'):
    if not path.is_file():
        parser.error(f'missing header: {path}')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def header_digest(root):
    """Hash relative names and bytes, in a stable order, without absolute paths."""
    result = hashlib.sha256()
    for path in sorted(root.rglob('*.h')):
        result.update(path.relative_to(root).as_posix().encode())
        result.update(b'\0')
        result.update(bytes.fromhex(digest(path)))
    return result.hexdigest()


def pkg_config(*args):
    return subprocess.check_output(['pkg-config', *args], text=True).strip()


gtk_version = pkg_config('--modversion', 'gtk4')
gtk_includes = shlex.split(pkg_config('--cflags-only-I', 'gtk4'))
with tempfile.TemporaryDirectory(prefix='webkit-metadata-', dir=output.parent) as work:
    work = Path(work)
    modulemap = work / 'modules.modulemap'
    umbrella = work / 'umbrella.h'
    generated = work / 'webkit.bin'
    modulemap.write_text(
        'module JavaScriptCore [system] {\n'
        f'  umbrella header "{webkit / "jsc/jsc.h"}"\n'
        '  export *\n  link "libjavascriptcoregtk-6.0.so.1"\n}\n'
        'module WebKit [system] {\n'
        f'  umbrella header "{webkit / "webkit/webkit.h"}"\n'
        '  export *\n  link "libwebkitgtk-6.0.so.4"\n}\n'
    )
    umbrella.write_text('#include <jsc/jsc.h>\n#include <webkit/webkit.h>\n')
    subprocess.run(
        [str(generator), '-input-umbrella', str(umbrella), '-output-bin', str(generated),
         'Xclang', f'-fmodule-map-file={modulemap}', f'-I{webkit}', f'-I{soup}', *gtk_includes],
        cwd=generator.parent,
        check=True,
    )
    if not generated.is_file() or not generated.stat().st_size:
        raise RuntimeError('metadata generator produced no output')
    record = {
        'generatorSha256': digest(generator),
        'webkitHeadersSha256': header_digest(webkit),
        'soupHeadersSha256': header_digest(soup),
        'gtkVersion': gtk_version,
        'gtkIncludes': gtk_includes,
        'metadataSha256': digest(generated),
    }
    # Output paths must be new; do not overwrite a previous run's evidence.
    with output.open('xb') as target, generated.open('rb') as source:
        while chunk := source.read(1024 * 1024):
            target.write(chunk)
    with manifest.open('x') as target:
        json.dump(record, target, indent=2)
        target.write('\n')
print(json.dumps({'metadata': str(output), **record}))
