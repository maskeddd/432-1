import { CognitoJwtVerifier } from "aws-jwt-verify"
import type { NextFunction, Request, Response } from "express"
import { AppError } from "../utils/appError.util.js"

const verifier = CognitoJwtVerifier.create({
	userPoolId: "ap-southeast-2_JUC9SbgGm",
	clientId: "188n87cm03j4saf9n20gjijpaj",
	tokenUse: "access",
})

export const verifyJWT = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authHeader = req.headers.authorization

		if (!authHeader) {
			return next(
				new AppError("Authorization header missing", 401, "MISSING_AUTH_HEADER")
			)
		}

		const [scheme, token] = authHeader.split(" ")

		if (scheme !== "Bearer" || !token) {
			return next(
				new AppError("Invalid authorization format", 401, "INVALID_AUTH_FORMAT")
			)
		}

		const payload = await verifier.verify(token)

		res.locals.user = {
			id: payload.sub,
		}

		next()
	} catch (err: unknown) {
		console.error("JWT verification failed", err)
		next(
			new AppError("Invalid or expired token", 401, "TOKEN_VERIFICATION_FAILED")
		)
	}
}
