import type { NextFunction, Request, Response } from "express"
import { getPresignedUploadUrl } from "../services/s3.service.js"
import { AppError } from "../utils/appError.util.js"

export async function handleUpload(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const { filename, contentType } = req.body

		if (!filename || !contentType) {
			return next(new AppError("Missing filename or contentType", 400))
		}

		const fileId = crypto.randomUUID()
		const extension = filename.split(".").pop() || "bin"
		const key = `raw/${fileId}.${extension}`

		const result = await getPresignedUploadUrl(key, contentType)

		res.json({
			fileId,
			uploadUrl: result.url,
			s3Key: result.key,
		})
	} catch (err: unknown) {
		console.error("Upload URL generation failed:", err)
		next(new AppError("Failed to generate upload URL", 500))
	}
}
