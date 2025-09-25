import { spawn } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { ClipperOptions, Segment } from "shared"
import { ClipperError } from "../utils/clipperError.util.js"

const getClipperPath = () => {
	const projectRoot = join(
		dirname(fileURLToPath(import.meta.url)),
		"..",
		"..",
		"..",
		".."
	)
	const isWindows = process.platform === "win32"
	return join(projectRoot, "bin", isWindows ? "clipper.exe" : "clipper")
}

function buildClipperArgs(
	inputPath: string,
	segments: Segment[],
	outputPath: string,
	options: ClipperOptions
): string[] {
	const args: string[] = ["-input", inputPath]

	segments.forEach((segment) => {
		args.push("-segment", `${segment.start}-${segment.end}`)
	})

	if (options.speed) args.push("-speed", options.speed.toString())
	if (options.resize) args.push("-resize", options.resize)
	if (options.fade) {
		args.push(
			typeof options.fade === "number" ? `-fade=${options.fade}` : "-fade"
		)
	}

	args.push("-y", outputPath)
	return args
}

async function runClipper(args: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const proc = spawn(getClipperPath(), args)

		let stdout = ""
		let stderr = ""

		proc.stdout.on("data", (chunk: Buffer) => {
			stdout += chunk.toString()
		})

		proc.stderr.on("data", (chunk: Buffer) => {
			stderr += chunk.toString()
		})

		proc.on("close", (exitCode) => {
			if (exitCode === 0) {
				resolve()
			} else {
				reject(
					new ClipperError(
						`Clipper process failed with exit code ${exitCode}`,
						exitCode ?? -1,
						stdout,
						stderr
					)
				)
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
	const args = buildClipperArgs(inputPath, segments, outputPath, options)

	await runClipper(args)
	return outputPath
}
