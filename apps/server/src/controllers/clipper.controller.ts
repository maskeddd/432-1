import { unlink } from "node:fs/promises"
import { basename } from "node:path"
import type { NextFunction, Request, Response } from "express"
import { ClipperOptionsSchema, SegmentSchema } from "shared"
import { z } from "zod"
import { processVideo } from "../services/clipper.service.js"
import { putJobItem, updateJobFields } from "../services/dynamodb.service.js"
import type { Job } from "../types/job"
import { AppError } from "../utils/appError.util.js"
import { cleanupTempDir, createTempDir } from "../utils/file.util.js"

const RequestSchema = z.object({
	segments: z
		.string()
		.transform((str) => z.array(SegmentSchema).parse(JSON.parse(str))),
	options: z
		.string()
		.optional()
		.transform((str) =>
			str ? ClipperOptionsSchema.parse(JSON.parse(str)) : {}
		),
})

async function cleanupFiles(tempDir: string | null, inputFilePath?: string) {
	const cleanupPromises = []

	if (tempDir) {
		cleanupPromises.push(cleanupTempDir(tempDir).catch(console.error))
	}

	if (inputFilePath) {
		cleanupPromises.push(
			unlink(inputFilePath)
				.then(() => console.log("Deleted uploaded file:", inputFilePath))
				.catch((e) => console.error("Failed to delete uploaded file:", e))
		)
	}

	if (cleanupPromises.length) {
		await Promise.allSettled(cleanupPromises)
	}
}

export async function clip(req: Request, res: Response, next: NextFunction) {
	let tempDir: string | null = null

	try {
		if (!req.file || !req.body.segments) {
			return next(new AppError("Missing 'video' or 'segments' field", 400))
		}

		const { segments, options } = RequestSchema.parse(req.body)

		tempDir = await createTempDir()
		const jobId = crypto.randomUUID()

		const job: Job = {
			jobId,
			user: res.locals.user.id,
			inputFile: req.file.originalname,
			status: "processing",
			createdAt: new Date().toISOString(),
		}

		await putJobItem(job)
		const outputPath = await processVideo(req.file, segments, tempDir, options)

		await updateJobFields(jobId, {
			status: "completed",
			outputFile: basename(outputPath),
		})

		res.setHeader("Content-Type", "video/mp4")
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${basename(outputPath)}"`
		)

		res.sendFile(outputPath, () => {
			cleanupFiles(tempDir, req.file?.path)
		})
	} catch (err) {
		await cleanupFiles(tempDir, req.file?.path)

		if (err instanceof SyntaxError || err instanceof z.ZodError) {
			return next(new AppError("Invalid JSON or schema in request body", 400))
		}
		next(err)
	}
}
