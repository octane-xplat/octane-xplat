"""Build one GLib sysroot from checksummed Ubuntu 24.04 packages."""

import argparse
import gzip
import hashlib
from pathlib import Path
import subprocess
import tarfile
import tempfile
from urllib.request import urlretrieve

SNAPSHOT = 'https://snapshot.ubuntu.com/ubuntu/20261122T000000Z/pool/main'
PACKAGES = (
    ('g/glib2.0', 'libglib2.0-dev', '2.80.0-6ubuntu3.10'),
    ('g/glib2.0', 'libglib2.0-0t64', '2.80.0-6ubuntu3.10'),
    ('libf/libffi', 'libffi-dev', '3.4.6-1build1'),
    ('libf/libffi', 'libffi8', '3.4.6-1build1'),
    ('p/pcre2', 'libpcre2-dev', '10.42-4ubuntu2.2'),
    ('p/pcre2', 'libpcre2-8-0', '10.42-4ubuntu2.2'),
)
TARGETS = {
    'x86_64': ('amd64', (
        '6d1d88d68192256603c0de05d084b8ef06ed9b16753215ec2c1ef9ef5fa15014',
        'ff1b650f655b36dfe202fdbae6bb02b363c7257b6dd23e4f95ab61f716190df3',
        '7009959b8a3b77206325026917fb45150ac81bf6139468abc0841d5a29c8619d',
        '637e6a7744de08cd331a41f4efd0d24e6ea9064843dea9d1c6ca87bdb5f038a2',
        '572714fe3fbe1b49ffb4c5a483223c663a51948e0d8590add1620917326f3d21',
        'f41da7cb7e979d6b037ea92650c72ec8ec532ec3c93aa8d5b997207de56695ea',
    )),
    'aarch64': ('arm64', (
        '7cf6c28c1895d6843e901f68dd2d90be5a9280bfef70e1e8dfaa2096e14c13ad',
        '2bfe91a671013e938cdf228f87ea98123a93b328c0ab7654388c04a285e438b5',
        '887755d6aa91c12ee0eb3404b61f6dc138c4c59234aa2add0264baf270337708',
        'a4d4607144bc599328a913d7312761fd8f4a650d67c7d5058f1f3667d771d37c',
        '1081629151e484aa09e77fc74c2f10b86ebc476295da80278f0c78d90b83e96a',
        '3209171ab2f528843351af0cb51fced4eab5b5f3456f3f2b025c40bec70bf7a0',
    )),
}


def build_sysroot(arch, output):
    deb_arch, checksums = TARGETS[arch]
    with tempfile.TemporaryDirectory(prefix='xplat-glib-') as tmp:
        temp = Path(tmp)
        root = temp / 'root'
        root.mkdir()
        for (pool, package, version), expected in zip(PACKAGES, checksums, strict=True):
            filename = f'{package}_{version}_{deb_arch}.deb'
            deb = temp / filename
            urlretrieve(f'{SNAPSHOT}/{pool}/{filename}', deb)
            with deb.open('rb') as source:
                if hashlib.file_digest(source, 'sha256').hexdigest() != expected:
                    raise ValueError(f'checksum mismatch for {filename}')
            data = subprocess.check_output(['ar', 'p', deb, 'data.tar.zst'])
            subprocess.run(['tar', '-xf', '-', '-C', root], input=data, check=True)

        paths = [root / 'usr/include', root / f'usr/lib/{arch}-linux-gnu']
        files = sorted(path for directory in paths for path in directory.rglob('*')
                       if path.is_symlink() or path.is_file())
        if not files:
            raise ValueError(f'no sysroot files extracted for {arch}')
        with output.open('xb') as file, gzip.GzipFile(filename='', mode='wb', fileobj=file, mtime=0) as compressed:
            with tarfile.open(fileobj=compressed, mode='w|', format=tarfile.USTAR_FORMAT) as archive:
                for path in files:
                    item = archive.gettarinfo(path, path.relative_to(root).as_posix())
                    item.uid = item.gid = item.mtime = 0
                    item.uname = item.gname = ''
                    item.mode = 0o644
                    if item.isfile():
                        with path.open('rb') as source:
                            archive.addfile(item, source)
                    else:
                        archive.addfile(item)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('arch', choices=TARGETS)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    build_sysroot(args.arch, args.output)
