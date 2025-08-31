import { unlink } from "node:fs/promises"
import { basename } from "node:path"
import type { NextFunction, Response } from "express"
import type { Request as JWTRequest } from "express-jwt"
import {
	type ClipperOptions,
	ClipperOptionsSchema,
	type Segment,
	SegmentSchema,
} from "shared"
import { z } from "zod"
import { addJob, updateJob } from "../data/jobs.store.js"
import { processVideo } from "../services/clipper.service.js"
import type { Job } from "../types/job"
import { AppError } from "../utils/appError.util.js"
import { cleanupTempDir, createTempDir } from "../utils/file.util.js"

export async function clip(req: JWTRequest, res: Response, next: NextFunction) {
	let tempDir: string | null = null

	try {
		tempDir = await createTempDir()

		const inputFile = req.file
		const segmentsJSON = req.body.segments
		const optionsJSON = req.body.options

		if (!inputFile || !segmentsJSON) {
			return next(new AppError("Missing 'video' or 'segments' field", 400))
		}

		const segments: Segment[] = z
			.array(SegmentSchema)
			.parse(JSON.parse(segmentsJSON))

		const options: ClipperOptions = optionsJSON
			? ClipperOptionsSchema.parse(JSON.parse(optionsJSON))
			: {}

		const jobId = crypto.randomUUID()
		const job: Job = {
			jobId,
			user: req.auth?.username ?? "guest",
			inputFile: inputFile.originalname,
			status: "processing",
			createdAt: new Date().toISOString(),
		}

		await addJob(job)

		const outputPath = await processVideo(inputFile, segments, tempDir, options)

		await updateJob(jobId, {
			status: "completed",
			outputFile: basename(outputPath),
		})

		res.setHeader("Content-Type", "video/mp4")
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${basename(outputPath)}"`
		)

		res.sendFile(outputPath, async (err) => {
			if (err) return next(err)

			if (tempDir) cleanupTempDir(tempDir).catch(console.error)

			if (inputFile?.path) {
				try {
					await unlink(inputFile.path)
					console.log("Deleted uploaded file:", inputFile.path)
				} catch (e) {
					console.error("Failed to delete uploaded file:", e)
				}
			}
		})
	} catch (err) {
		if (err instanceof SyntaxError || err instanceof z.ZodError) {
			return next(new AppError("Invalid JSON or schema in request body", 400))
		}
		next(err)
	}
}

export async function processTemp(
	req: JWTRequest,
	res: Response,
	next: NextFunction
) {
	let tempDir: string | null = null

	try {
		const { filename, segments, options } = req.body

		if (!filename || !segments) {
			return res.status(400).json({ error: "Missing filename or segments" })
		}

		const parsedSegments: Segment[] = z.array(SegmentSchema).parse(segments)

		const parsedOptions: ClipperOptions = options ?? {}

		tempDir = await createTempDir()

		const inputPath = `uploads/${filename}`
		const outputPath = await processVideo(
			inputPath,
			parsedSegments,
			tempDir,
			parsedOptions
		)

		res.json({ message: "Processing complete", output: outputPath })
	} catch (err) {
		if (err instanceof z.ZodError) {
			return next(new AppError("Invalid segments format", 400))
		}
		next(err)
	} finally {
		if (tempDir) cleanupTempDir(tempDir).catch(console.error)
	}
}
