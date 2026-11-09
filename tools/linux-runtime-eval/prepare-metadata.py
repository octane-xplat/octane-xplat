"""Prepare an isolated executable directory with SDK and Mason metadata on Linux."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--package', type=Path, required=True, help='Extracted @nativescript/linux package directory')
parser.add_argument('--header', type=Path, required=True, help='Mason C public mason_native.h from the matching engine source')
parser.add_argument('--library', type=Path, required=True, help='Matching Linux ARM64 libmason_c.so')
parser.add_argument('--facade-header', type=Path, action='append', default=[], help='Extra C facade header exposing a second module (repeatable, pair with --facade-library)')
parser.add_argument('--facade-library', type=Path, action='append', default=[], help='Shared library the matching --facade-header module links (repeatable)')
parser.add_argument('--output', type=Path, required=True, help='New, disposable work directory')
args = parser.parse_args()
if len(args.facade_header) != len(args.facade_library):
    parser.error('--facade-header and --facade-library must appear in pairs')
out = args.output.resolve()
out.mkdir(parents=True, exist_ok=False)
package = args.package.resolve()
# This probe targets the existing ARM64 VM, not an untested architecture matrix.
runtime = package/'framework/runtime/arm64'
shutil.copy2(runtime/'ns-linux',out/'ns-linux')
shutil.copy2(runtime/'metadata-aarch64.bin',out/'metadata-aarch64.bin')
header = args.header.read_text()
header = re.sub(r'^#include.*$', '', header, flags=re.M)
standard = 'typedef unsigned long uintptr_t; typedef unsigned long size_t; typedef unsigned char uint8_t; typedef unsigned short uint16_t; typedef unsigned int uint32_t; typedef unsigned long uint64_t; typedef signed char int8_t; typedef short int16_t; typedef int int32_t; typedef long int64_t; typedef _Bool bool;\n'
(out/'mason.h').write_text(standard+header)
# No system development headers are required; declarations retain the upstream ABI.
(out/'lib').mkdir()
shutil.copy2(args.library,out/'lib/libmason_c.so')
(out/'module.modulemap').write_text('module Mason { header "mason.h" export * link "libmason_c.so" }\n')
(out/'umbrella.h').write_text('#include "mason.h"\n')
(out/'metadata').mkdir()
subprocess.run([str(package/'framework/tools/arm64/metadata-generator'),'-input-umbrella',str(out/'umbrella.h'),'-output-bin',str(out/'metadata/mason.bin'),'Xclang',f'-fmodule-map-file={out}/module.modulemap',f'-I{out}'],check=True,cwd=out)
# Optional extra facade modules (e.g. XplatMason). Their headers include
# <glib.h>/<gtk/gtk.h>, unavailable on a runtime-only host, so declarations
# are replaced with ABI-equivalent typedefs just like mason.h above.
facadeTypes = 'typedef unsigned int guint; typedef int gint; typedef int gboolean; typedef float gfloat; typedef double gdouble; typedef char gchar; typedef unsigned char guchar; typedef unsigned long gsize; typedef long gssize; typedef void* gpointer; typedef const void* gconstpointer; typedef unsigned char guint8; typedef unsigned short guint16; typedef unsigned int guint32; typedef unsigned long guint64; typedef signed char gint8; typedef short gint16; typedef int gint32; typedef long gint64; typedef void GBytes; typedef void GtkWidget; typedef void GtkAccessible; typedef int GtkAccessibleState; typedef int GtkAccessibleProperty; typedef int GtkOrientation;\n#define G_BEGIN_DECLS\n#define G_END_DECLS\n'
facadeInputs = []
for i,(headerPath,libraryPath) in enumerate(zip(args.facade_header,args.facade_library)):
    headerPath = headerPath.resolve(); libraryPath = libraryPath.resolve()
    stem = headerPath.stem
    module = stem[0].upper()+stem[1:]
    text = re.sub(r'^#include.*$', '', headerPath.read_text(), flags=re.M)
    (out/f'{stem}.h').write_text(standard+facadeTypes+text)
    shutil.copy2(libraryPath,out/f'lib/{libraryPath.name}')
    (out/f'{stem}.modulemap').write_text(f'module {module} {{ header "{stem}.h" export * link "{libraryPath.name}" }}\n')
    (out/f'{stem}-umbrella.h').write_text(f'#include "{stem}.h"\n')
    subprocess.run([str(package/'framework/tools/arm64/metadata-generator'),'-input-umbrella',str(out/f'{stem}-umbrella.h'),'-output-bin',str(out/f'metadata/{stem}.bin'),'Xclang',f'-fmodule-map-file={out}/{stem}.modulemap',f'-I{out}'],check=True,cwd=out)
    facadeInputs += [(f'facadeHeader{i}',headerPath),(f'facadeLibrary{i}',libraryPath)]
inputs = {'header':args.header,'library':args.library,'runtime':runtime/'ns-linux','sdkMetadata':runtime/'metadata-aarch64.bin'}
inputs.update(facadeInputs)
(out/'inputs.json').write_text(json.dumps({name:{'path':str(path.resolve()),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()} for name,path in inputs.items()},indent=2)+'\n')
print(out/'ns-linux')
