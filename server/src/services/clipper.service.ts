import { join } from "node:path"
import type { ClipperOptions, Segment } from "shared/src"

export class ClipperError extends Error {
	public readonly exitCode: number
	public readonly stdout: string
	public readonly stderr: string

	constructor(
		message: string,
		exitCode: number,
		stdout: string,
		stderr: string
	) {
		super(message)
		this.name = "ClipperError"
		this.exitCode = exitCode
		this.stdout = stdout
		this.stderr = stderr
	}
}

async function runClipper(args: string[]): Promise<void> {
	const clipperPath = join(__dirname, "../../..", "bin", "clipper")

	const proc = Bun.spawn([clipperPath, ...args], {
		stdout: "pipe",
		stderr: "pipe",
	})

	const [exitCode, stdout, stderr] = await Promise.all([
		proc.exited,
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
	])

	if (exitCode !== 0) {
		const message = `Clipper process failed with exit code ${exitCode}.`
		throw new ClipperError(message, exitCode, stdout, stderr)
	}
}

export async function processVideo(
	input: Express.Multer.File,
	segments: Segment[],
	tempDir: string,
	options: ClipperOptions = {}
): Promise<string> {
	if (!input.path) {
		throw new Error("No valid input file path provided")
	}

	const inputPath = input.path
	const outputPath = join(tempDir, `output-${Date.now()}.mp4`)

	const args: string[] = []

	args.push("-input", inputPath)
	for (const segment of segments) {
		args.push("-segment", `${segment.start}-${segment.end}`)
	}

	if (options.speed) args.push("-speed", options.speed.toString())
	if (options.resize) args.push("-resize", options.resize)
	if (options.fade) {
		if (typeof options.fade === "number") {
			args.push(`-fade=${options.fade}`)
		} else {
			args.push("-fade")
		}
	}

	args.push("-y")
	args.push(outputPath)

	await runClipper(args)

	return outputPath
}
