import type { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { users } from "../utils/users.util.js"

const JWT_SECRET = "supersecret"

export function login(req: Request, res: Response) {
	const { username, password } = req.body

	const user = users.find(
		(u) => u.username === username && u.password === password
	)

	if (!user) {
		return res.status(401).json({ error: "Invalid credentials" })
	}

	const token = jwt.sign(
		{ username: user.username, role: user.role },
		JWT_SECRET,
		{
			expiresIn: "1h",
		}
	)

	res.json({ token })
}
