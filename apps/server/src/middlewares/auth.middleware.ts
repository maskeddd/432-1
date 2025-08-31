import type { RequestHandler } from "express"
import { expressjwt } from "express-jwt"

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

export const authenticateJWT: RequestHandler = expressjwt({
	secret: JWT_SECRET,
	algorithms: ["HS256"],
})

export const optionalAuth: RequestHandler = expressjwt({
	secret: JWT_SECRET,
	algorithms: ["HS256"],
	credentialsRequired: false, // 👈 makes it optional
})
