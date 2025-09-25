import type { NextFunction, Request, Response } from "express"
import stripAnsi from "strip-ansi"
import { ClipperError } from "../services/clipper.service.js"
import { AppError } from "../utils/appError.util.js"

export function errorHandler(
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction
) {
	console.error("Error:", err)

	if (err instanceof ClipperError) {
		const clipperOutput = err.stderr || err.stdout
		const errorMessage = clipperOutput
			? stripAnsi(clipperOutput)
			: "No output from clipper"

		return res.status(500).json({
			error: "Video processing failed",
			details: err.message,
			clipper_error: errorMessage,
			exit_code: err.exitCode,
		})
	}

	if (err instanceof AppError) {
		const response: { error: string; details?: string } = { error: err.message }

		if (err.details) {
			response.details = err.details
		}

		return res.status(err.statusCode).json(response)
	}

	return res.status(500).json({
		error: "Internal server error",
		details: err instanceof Error ? err.message : String(err),
	})
}
