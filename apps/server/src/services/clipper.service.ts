import { spawn } from "node:child_process"
import { join } from "node:path"
import type { ClipperOptions, Segment } from "shared"

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
	return new Promise((resolve, reject) => {
		const proc = spawn("clipper", args)

		let stdout = ""
		let stderr = ""

		proc.stdout.on("data", (chunk) => {
			stdout += chunk.toString()
		})

		proc.stderr.on("data", (chunk) => {
			stderr += chunk.toString()
		})

		proc.on("close", (exitCode) => {
			if (exitCode === 0) {
				resolve()
			} else {
				const message = `Clipper process failed with exit code ${exitCode}.`
				reject(new ClipperError(message, exitCode ?? -1, stdout, stderr))
			}
		})

		proc.on("error", (err) => {
			reject(err)
		})
	})
}

export async function processVideo(
	input: Express.Multer.File | string,
	segments: Segment[],
	tempDir: string,
	options: ClipperOptions = {}
): Promise<string> {
	const inputPath = typeof input === "string" ? input : input.path
	if (!inputPath) {
		throw new Error("No valid input file path provided")
	}

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
