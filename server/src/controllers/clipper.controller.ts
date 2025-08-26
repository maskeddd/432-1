import { unlink } from "node:fs/promises"
import { basename } from "node:path"
import type { NextFunction, Request, Response } from "express"
import {
	type ClipperOptions,
	ClipperOptionsSchema,
	type Segment,
	SegmentSchema,
} from "shared/src"
import { z } from "zod"
import { processVideo } from "../services/clipper.service.ts"
import { AppError } from "../utils/appError.util.ts"
import { cleanupTempDir, createTempDir } from "../utils/file.util.ts"

export async function clip(req: Request, res: Response, next: NextFunction) {
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

		const outputPath = await processVideo(inputFile, segments, tempDir, options)

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
