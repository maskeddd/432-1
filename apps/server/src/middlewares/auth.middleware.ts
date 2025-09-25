import { CognitoJwtVerifier } from "aws-jwt-verify"
import type { NextFunction, Request, Response } from "express"
import { AppError } from "../utils/appError.util.js"

const userPoolId = process.env.COGNITO_USER_POOL_ID
const clientId = process.env.COGNITO_CLIENT_ID

if (!userPoolId || !clientId) {
	throw new Error(
		"Missing required environment variables: COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID"
	)
}

const verifier = CognitoJwtVerifier.create({
	userPoolId,
	clientId,
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
