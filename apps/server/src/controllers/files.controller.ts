import type { NextFunction, Request, Response } from "express"
import { getPresignedUploadUrl } from "../services/s3.service.js"
import { AppError } from "../utils/appError.util.js"

export async function getUploadUrl(
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
		const key = `uploads/${fileId}.${extension}`

		const result = await getPresignedUploadUrl(key, contentType)

		res.json(result)
	} catch (err: unknown) {
		console.error("Upload URL generation failed:", err)
		next(new AppError("Failed to generate upload URL", 500))
	}
}
