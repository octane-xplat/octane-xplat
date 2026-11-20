"""Collect release notices from the locked NativeScript Linux Cargo graph."""

import argparse
import json
from pathlib import Path
import re
import subprocess


def collect(args):
    cargo = ['cargo', '+1.99.1']
    inputs = ['--locked', '--manifest-path', str(args.source / 'Cargo.toml')]
    target = f'{args.arch}-unknown-linux-gnu'
    metadata = json.loads(subprocess.check_output(
        [*cargo, 'metadata', *inputs, '--filter-platform', target, '--format-version', '1'],
    ))
    tree = subprocess.check_output(
        [*cargo, 'tree', *inputs, '--target', target, '-p', 'nativescript-cli',
         '--edges', 'normal', '--prefix', 'none', '--format', '{p}', '--color', 'never'],
        text=True,
    )
    linked = set(re.findall(r'^(\S+) v(\S+)', tree, re.M))
    blocks = ['Rust dependencies of ns-linux, from its locked Cargo dependency tree.\n']
    for package in sorted(metadata['packages'], key=lambda item: (item['name'], item['version'])):
        name, version = package['name'], package['version']
        if not package['source'] or (name, version) not in linked:
            continue
        root = Path(package['manifest_path']).parent
        title = f'{name} {version} ({package["license"] or "see upstream notice"})'
        files = sorted(path for path in root.iterdir()
                       if path.is_file() and path.name.upper().startswith(
                           ('LICENSE', 'LICENCE', 'NOTICE', 'COPYING', 'COPYRIGHT', 'UNLICENSE')))
        if package['license_file']:
            files.append(root / package['license_file'])
        if name in ('libffi', 'libffi-sys'):
            # These crates omit the workspace-root notices from their crates.io archives.
            files.extend(sorted(args.supplemental.glob(f'{name}-{version}-LICENSE-*')))
            if name == 'libffi-sys':
                files.append(root / 'libffi/LICENSE')
        if name == 'v8':
            files.append(args.v8)
        if not files:
            raise ValueError(f'no notice found for {title}')
        text = '\n\n'.join(f'{path.name}\n{path.read_text(encoding="utf-8").strip()}'
                           for path in dict.fromkeys(files))
        blocks.append(f'{title}\n{"=" * len(title)}\n{text}')
    with args.output.open('x') as stream:
        stream.write('\n\n'.join(blocks) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--arch', choices=('x86_64', 'aarch64'), required=True)
    for name in ('source', 'supplemental', 'v8', 'output'):
        parser.add_argument(f'--{name}', type=Path, required=True)
    try:
        collect(parser.parse_args())
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'{error}\n')
