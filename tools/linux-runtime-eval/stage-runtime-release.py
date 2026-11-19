"""Install the pinned payload pair into a Linux GTK renderer package staging tree."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import tempfile


def verified_payload(source, arch, expected):
    source = source.resolve(strict=True)
    path = source / 'manifest.json'
    if path.is_symlink() or not path.is_file():
        raise ValueError(f'{arch} payload manifest must be a regular file')
    manifest_bytes = path.read_bytes()
    if hashlib.sha256(manifest_bytes).hexdigest() != expected:
        raise ValueError(f'{arch} manifest does not match the release pin')
    manifest = json.loads(manifest_bytes)
    if manifest['version'] != 1 or manifest['architecture'] != arch:
        raise ValueError(f'expected a version 1 {arch} runtime payload')
    files = manifest['files']
    for name, digest in files.items():
        file = source / name
        if file.is_symlink() or file.resolve(strict=True) != file or not file.is_file():
            raise ValueError(f'{arch} payload entry is not a regular file: {name}')
        with file.open('rb') as stream:
            if hashlib.file_digest(stream, 'sha256').hexdigest() != digest:
                raise ValueError(f'{arch} payload checksum mismatch: {name}')
    return source, files


def stage(x86, arm, output):
    pins = json.loads(Path(__file__).with_name('runtime-pins.json').read_bytes())
    if pins['version'] != 1:
        raise ValueError('unsupported Linux GTK runtime pin format')
    sources = {
        arch: verified_payload(source, arch, pins['manifests'][arch])
        for arch, source in (('x86_64', x86), ('aarch64', arm))
    }
    if sources['x86_64'][1]['gi.json'] != sources['aarch64'][1]['gi.json']:
        raise ValueError('the pinned runtimes must use the same GI schema')

    if output.exists() or output.is_symlink():
        raise ValueError(f'output already exists: {output}')
    with tempfile.TemporaryDirectory(prefix='.linux-runtime-', dir=output.parent) as work:
        pair = Path(work) / 'runtime'
        for arch, (source, files) in sources.items():
            for name in ('manifest.json', *files):
                destination = pair / arch / name
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source / name, destination)
                destination.chmod(0o755 if name == 'ns-linux' else 0o644)
            verified_payload(pair / arch, arch, pins['manifests'][arch])
        pair.rename(output)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--x86-64', type=Path, required=True)
    parser.add_argument('--aarch64', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True, help='New renderer platforms/linux/runtime directory')
    args = parser.parse_args()
    try:
        stage(args.x86_64, args.aarch64, args.output)
    except (OSError, KeyError, ValueError) as error:
        parser.exit(1, f'{error}\n')
