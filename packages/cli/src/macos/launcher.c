#include <errno.h>
#include <limits.h>
#include <mach-o/dyld.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static int fail(const char *message) {
	fprintf(stderr, "macOS app launcher: %s\n", message);
	return 127;
}

int main(int argc, char **argv) {
	uint32_t executable_path_size = 0;
	(void)_NSGetExecutablePath(NULL, &executable_path_size);
	if (executable_path_size == 0) {
		return fail("could not determine executable path");
	}

	char *executable_path = malloc(executable_path_size);
	if (executable_path == NULL) {
		return fail("could not allocate executable path buffer");
	}

	if (_NSGetExecutablePath(executable_path, &executable_path_size) != 0) {
		free(executable_path);
		return fail("executable path buffer was too small");
	}

	char resolved_path[PATH_MAX];
	if (realpath(executable_path, resolved_path) == NULL) {
		fprintf(stderr, "macOS app launcher: could not resolve executable path: %s\n", strerror(errno));
		free(executable_path);
		return 127;
	}
	free(executable_path);

	char *macos_directory = strrchr(resolved_path, '/');
	if (macos_directory == NULL) {
		return fail("executable is not inside a macOS app bundle");
	}
	*macos_directory = '\0';

	char *contents_directory = strrchr(resolved_path, '/');
	if (contents_directory == NULL) {
		return fail("executable is not inside a macOS app bundle");
	}
	*contents_directory = '\0';

	char node_path[PATH_MAX];
	char entry_path[PATH_MAX];
	int node_path_size = snprintf(node_path, sizeof(node_path), "%s/Helpers/octane-node", resolved_path);
	int entry_path_size = snprintf(entry_path, sizeof(entry_path), "%s/Resources/app/main.cjs", resolved_path);
	if (
		node_path_size < 0 ||
		(size_t)node_path_size >= sizeof(node_path) ||
		entry_path_size < 0 ||
		(size_t)entry_path_size >= sizeof(entry_path)
	) {
		return fail("app bundle path is too long");
	}

	char **node_argv = calloc((size_t)argc + 2, sizeof(*node_argv));
	if (node_argv == NULL) {
		return fail("could not allocate Node argument list");
	}

	node_argv[0] = node_path;
	node_argv[1] = entry_path;
	for (int index = 1; index < argc; index++) {
		node_argv[index + 1] = argv[index];
	}

	execv(node_path, node_argv);
	fprintf(stderr, "macOS app launcher: could not launch bundled Node runtime: %s\n", strerror(errno));
	free(node_argv);
	return 127;
}
