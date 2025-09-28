import crypto from "node:crypto"
import { basename, join } from "node:path"
import type { NextFunction, Request, Response } from "express"
import { ClipperOptionsSchema, SegmentSchema } from "shared"
import { z } from "zod"
import { processVideo } from "../services/clipper.service.js"
import { putJobItem, updateJobFields } from "../services/dynamodb.service.js"
import {
	downloadFileFromS3,
	getPresignedDownloadUrl,
	uploadFileToS3,
} from "../services/s3.service.js"
import type { Job } from "../types/job"
import { AppError } from "../utils/appError.util.js"
import { cleanupTempDir, createTempDir } from "../utils/file.util.js"

const RequestSchema = z.object({
	key: z.string(),
	segments: z.array(SegmentSchema),
	options: ClipperOptionsSchema.optional().default({}),
})

export async function clip(req: Request, res: Response, next: NextFunction) {
	let tempDir: string | null = null
	try {
		const { key, segments, options } = RequestSchema.parse(req.body)
		tempDir = await createTempDir()
		const jobId = crypto.randomUUID()
		const localInputPath = join(tempDir, basename(key))

		const job: Job = {
			jobId,
			user: res.locals.user.id,
			inputFile: key,
			status: "processing",
			createdAt: new Date().toISOString(),
		}
		await putJobItem(job)

		await downloadFileFromS3(key, localInputPath)

		const outputPath = await processVideo(
			localInputPath,
			segments,
			tempDir,
			options
		)

		const outputKey = await uploadFileToS3(outputPath)
		await updateJobFields(jobId, {
			status: "completed",
			outputFile: basename(outputPath),
		})

		const downloadUrl = await getPresignedDownloadUrl(outputKey)
		res.json({ jobId, downloadUrl })
	} catch (err) {
		if (err instanceof SyntaxError || err instanceof z.ZodError) {
			return next(new AppError("Invalid request", 400))
		}
		next(err)
	} finally {
		if (tempDir) await cleanupTempDir(tempDir).catch(console.error)
	}
}
