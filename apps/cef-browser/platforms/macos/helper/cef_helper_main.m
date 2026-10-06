// CEF helper (subprocess) executable — built by scripts/build-cef-runtime.sh
// into each "XplatCefSpike Helper*.app" bundle. Mirrors cefclient's helper:
// load the framework and bundled dylibs FIRST (the seatbelt blocks dlopen
// file access), then cef_sandbox_initialize, then cef_execute_process.
// It deliberately avoids linking CEF so the same tiny binary works for
// every helper flavor.
#import <Foundation/Foundation.h>
#include <dirent.h>
#include <dlfcn.h>
#include <libgen.h>
#include <mach-o/dyld.h>
#include <stdio.h>
#include <string.h>

typedef struct {
	int argc;
	char** argv;
} cef_main_args_t;

static void exe_dir(char* out, size_t size) {
	uint32_t len = 0;
	_NSGetExecutablePath(NULL, &len);
	char* buf = malloc(len);
	_NSGetExecutablePath(buf, &len);
	snprintf(out, size, "%s", dirname(buf));
	free(buf);
}

int main(int argc, char* argv[]) {
	@autoreleasepool {
		char dir[4096];
		exe_dir(dir, sizeof(dir));

		// <Helper>.app/Contents/MacOS/<exe> → ../../../ is Contents/Frameworks.
		char frameworks[8192];
		snprintf(frameworks, sizeof(frameworks), "%s/../../..", dir);

		char sandbox_path[8192];
		snprintf(sandbox_path,
				 sizeof(sandbox_path),
				 "%s/Chromium Embedded Framework.framework/Libraries/libcef_sandbox.dylib",
				 frameworks);

		char framework_path[8192];
		snprintf(framework_path,
				 sizeof(framework_path),
				 "%s/Chromium Embedded Framework.framework/Chromium Embedded Framework",
				 frameworks);

		// CEF documents: initialize the V2 sandbox FIRST (it reads the
		// serialized policy from the --seatbelt-client fd that the browser
		// passes), then load the framework — the seatbelt profile allows
		// reads inside the main bundle.
		void* sandbox_context = NULL;
		if (!getenv("XPLAT_CEF_NO_SANDBOX")) {
			void* sandbox = dlopen(sandbox_path, RTLD_LAZY | RTLD_LOCAL | RTLD_FIRST);
			if (!sandbox) {
				fprintf(stderr, "[cef-helper] sandbox dlopen failed: %s\n", dlerror());
				return 1;
			}

			void* (*sandbox_initialize)(int, char**) =
				dlsym(sandbox, "cef_sandbox_initialize");
			if (!sandbox_initialize) {
				fprintf(stderr, "[cef-helper] cef_sandbox_initialize missing\n");
				return 1;
			}

			sandbox_context = sandbox_initialize(argc, argv);
			if (!sandbox_context) {
				fprintf(stderr, "[cef-helper] cef_sandbox_initialize failed\n");
				return 1;
			}
		}

		void* cef = dlopen(framework_path, RTLD_LAZY | RTLD_GLOBAL | RTLD_FIRST);
		if (!cef) {
			fprintf(stderr, "[cef-helper] framework dlopen failed: %s\n", dlerror());
			return 1;
		}

		// Preload bundled support dylibs (ANGLE/vulkan/swiftshader).
		char libs_dir[8192];
		snprintf(libs_dir, sizeof(libs_dir),
				 "%s/Chromium Embedded Framework.framework/Libraries", frameworks);
		DIR* d = opendir(libs_dir);
		if (d) {
			struct dirent* e;
			char p[8192];
			while ((e = readdir(d))) {
				size_t n = strlen(e->d_name);
				if (n > 6 && !strcmp(e->d_name + n - 6, ".dylib")) {
					snprintf(p, sizeof(p), "%s/%s", libs_dir, e->d_name);
					if (!dlopen(p, RTLD_LAZY | RTLD_GLOBAL | RTLD_FIRST))
						fprintf(stderr, "[cef-helper] preload %s failed: %s\n",
								e->d_name, dlerror());
				}
			}
			closedir(d);
		}

		int (*execute)(const cef_main_args_t*, void*, void*) =
			dlsym(cef, "cef_execute_process");
		if (!execute) {
			fprintf(stderr, "[cef-helper] cef_execute_process missing\n");
			return 1;
		}

		// Populate the C API version table — required before any CEF C API
		// entry point, including cef_execute_process.
		unsigned long long (*api_hash)(int, int) = dlsym(cef, "cef_api_hash");
		if (api_hash) {
			(void)api_hash(15400, 0);
		}

		cef_main_args_t args = {argc, argv};
		return execute(&args, NULL, NULL);
	}
}
