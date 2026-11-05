import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gifBytes } from './gif.mjs'
const root = fileURLToPath(new URL('..', import.meta.url))
const directory = await mkdtemp(join(tmpdir(), 'xplat-converter-android-'))
const sdk = process.env.ANDROID_HOME ?? join(homedir(), 'Library/Android/sdk')
function run(command, args) {
	const result = spawnSync(command, args, { encoding: 'utf8', timeout: 60000 })
	assert.equal(result.status, 0, result.stdout + result.stderr)
	return result.stdout
}
try {
	const response = await fetch(
		'https://repo.maven.apache.org/maven2/com/github/bumptech/glide/gifdecoder/4.16.0/gifdecoder-4.16.0.jar',
	)
	assert.ok(response.ok)
	const jar = join(directory, 'gifdecoder.jar')
	await writeFile(jar, Buffer.from(await response.arrayBuffer()))
	const android = join(sdk, 'platforms/android-35/android.jar')
	const classpath = [android, jar, directory].join(delimiter)
	await writeFile(
		join(directory, 'Timing.java'),
		`import java.lang.reflect.Method;
import java.nio.file.*;
import java.util.Arrays;
public final class Timing {
 public static void main(String[] args) throws Exception {
  Class<?> engine=Class.forName("com.octanexplat.converter.Converter");
  Method delays=engine.getDeclaredMethod("delays",byte[].class);delays.setAccessible(true);
  int[] result=(int[])delays.invoke(null,(Object)Files.readAllBytes(Path.of(args[0])));
  if(!Arrays.equals(result,new int[]{10,100,300}))throw new AssertionError(Arrays.toString(result));
  System.out.println("ANDROID_SOURCE_OK original-10ms-and-default-delays");
 }
}`,
	)
	await writeFile(
		join(directory, 'timing.gif'),
		gifBytes({
			frames: [
				[0, 1, 1, false],
				[0, 0, 1, false],
				[1, 30, 2, false],
			],
		}),
	)
	run('javac', [
		'-cp',
		classpath,
		'-d',
		directory,
		join(root, 'platforms/android/java/com/octanexplat/converter/Converter.java'),
		join(directory, 'Timing.java'),
	])
	console.log(run('java', ['-cp', classpath, 'Timing', join(directory, 'timing.gif')]).trim())
	console.log(
		'Android SDK compilation and original GIF delay parsing passed; MediaCodec/device runtime remains unverified.',
	)
} finally {
	await rm(directory, { recursive: true, force: true })
}
