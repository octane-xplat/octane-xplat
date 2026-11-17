"""Assemble one architecture of the relocatable Linux GTK runtime payload."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil


ARCHITECTURES = {'x86_64': 62, 'aarch64': 183}
ICU_SHA256 = '1cf67874b5a87a8363a86fb3f81e3cbbed54d389062dab8fb52308d5cf8c8612'


def sha256(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def require_elf(path, arch):
    with path.open('rb') as stream:
        header = stream.read(20)
    if header[:6] != b'\x7fELF\x02\x01' or int.from_bytes(header[18:20], 'little') != ARCHITECTURES[arch]:
        raise ValueError(f'expected a {arch} Linux ELF file: {path}')


def assembly(args):
    arch = args.arch
    runtime = args.build / 'ns-linux'
    license = args.build / 'LICENSE.linux-runtime'
    checksums = (args.build / 'SHA256SUMS').read_text().splitlines()
    for path in (runtime, license):
        if f'{sha256(path)}  {path.name}' not in checksums:
            raise ValueError(f'build checksum does not match: {path}')
    if sha256(args.prepared / 'ns-linux') != sha256(runtime):
        raise ValueError('prepared SDK must use the executable from the selected build')
    if sha256(args.icu) != ICU_SHA256:
        raise ValueError('ICU data must match the pinned V8 build')

    schema = json.loads(args.schema.read_text())['namespaces']
    for namespace in ('Gtk', 'GObject', 'GLib', 'XplatMason', 'JavaScriptCore', 'WebKit'):
        if not schema.get(namespace):
            raise ValueError(f'GI schema is missing {namespace}')

    files = {
        'ns-linux': runtime,
        f'metadata-{arch}.bin': args.prepared / f'metadata-{arch}.bin',
        'metadata/mason.bin': args.prepared / 'metadata/mason.bin',
        'metadata/xplatmason.bin': args.prepared / 'metadata/xplatmason.bin',
        'metadata/webkit.bin': args.webkit,
        'lib/libmason_c.so': args.prepared / 'lib/libmason_c.so',
        'lib/libxplatmason-gtk.so': args.prepared / 'lib/libxplatmason-gtk.so',
        'icu/icudt77l.dat': args.icu,
        'gi.json': args.schema,
        'licenses/linux-runtime.txt': license,
    }
    for name in ('icu', 'mason', 'v8'):
        files[f'licenses/{name}.txt'] = args.licenses / f'{name}.txt'
    for path in sorted(args.typings.glob('*.d.ts')):
        files[f'typings/{path.name}'] = path
    if 'typings/index.d.ts' not in files:
        raise ValueError('the SDK declarations must include index.d.ts')
    for declaration in args.typings.glob('*.d.ts'):
        for reference in re.findall(r'<reference path="\./([^"/]+)"', declaration.read_text()):
            if f'typings/{reference}' not in files:
                raise ValueError(f'SDK reference is absent: {reference}')
    for name, path in files.items():
        if not path.is_file() or not path.stat().st_size:
            raise ValueError(f'missing or empty payload file: {path}')
        if name == 'ns-linux' or name.startswith('lib/'):
            require_elf(path, arch)

    manifest = {
        'version': 1,
        'architecture': arch,
        'files': {name: sha256(path) for name, path in sorted(files.items())},
    }
    args.output.mkdir()
    for name, path in files.items():
        target = args.output / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, target)
        target.chmod(0o755 if name == 'ns-linux' else 0o644)
        if sha256(target) != manifest['files'][name]:
            raise ValueError(f'payload input changed during staging: {path}')
    (args.output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--arch', choices=ARCHITECTURES, required=True)
    for name in ('build', 'prepared', 'webkit', 'icu', 'schema', 'typings', 'licenses', 'output'):
        parser.add_argument(f'--{name}', type=Path, required=True)
    try:
        assembly(parser.parse_args())
    except (OSError, KeyError, ValueError) as error:
        parser.exit(1, f'{error}\n')
