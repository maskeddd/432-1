import { CognitoJwtVerifier } from "aws-jwt-verify"
import type { NextFunction, Request, Response } from "express"
import { getParameters } from "shared"
import { AppError } from "../utils/appError.util.js"

let verifier: ReturnType<typeof CognitoJwtVerifier.create>

export async function initCognito() {
	const { userPoolId, clientId } = await getParameters({
		userPoolId: "/group83/cognito/userPoolId",
		clientId: "/group83/cognito/clientId",
	})

	if (!userPoolId || !clientId) {
		throw new Error(
			"Missing required parameters: cognito/userPoolId and cognito/clientId"
		)
	}

	verifier = CognitoJwtVerifier.create({
		userPoolId,
		clientId,
		tokenUse: "access",
	})

	await verifier.hydrate()
}

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
			groups: payload["cognito:groups"],
		}

		next()
	} catch (err: unknown) {
		console.error("JWT verification failed", err)
		next(
			new AppError("Invalid or expired token", 401, "TOKEN_VERIFICATION_FAILED")
		)
	}
}
