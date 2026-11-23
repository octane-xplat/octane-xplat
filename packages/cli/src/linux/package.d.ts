/** Build and package a native GTK app with NativeScript.
 * @param appRoot App directory declaring xplat.targets.linux.package.
 * @returns Paths to the relocatable app directory and gzip tar archive.
 * @throws When configuration, frontend build, or archive creation fails.
 */
export declare function packageLinux(appRoot: string): Promise<{ appDir: string; archive: string }>
