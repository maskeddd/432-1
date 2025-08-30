import type { NextFunction, Request, Response } from "express"
import stripAnsi from "strip-ansi"
import { ClipperError } from "../services/clipper.service.ts"
import { AppError } from "../utils/appError.util.ts"

export function errorHandler(
	err: any,
	_req: Request,
	res: Response,
	_next: NextFunction
) {
	console.error("Error:", err)

	if (err instanceof ClipperError) {
		const errorMessage = err.stderr
			? stripAnsi(err.stderr)
			: stripAnsi(err.stdout)

		return res.status(500).json({
			error: "Video processing failed",
			details: err.message,
			clipper_error: errorMessage || "No output from clipper",
			exit_code: err.exitCode,
		})
	}

	if (err instanceof AppError) {
		return res.status(err.statusCode).json({
			error: err.message,
			details: err.details,
		})
	}

	return res.status(500).json({
		error: "Unexpected server error",
		details: err instanceof Error ? err.message : "Unknown error",
	})
}
